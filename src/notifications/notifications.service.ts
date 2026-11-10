import { BadRequestException, HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { Request } from 'express';
import { In, Repository } from 'typeorm';
import { Sucursales } from '../sucursales/entities/sucursale.entity';
import { normalizePage, toPagedResponse } from '../common/pagination/paged-response';
import { decryptSecret, encryptSecret } from './crypto.util';
import { CopyConfigDto, CreateRecipientDto, UpdateRecipientDto, UpsertSmtpConfigDto } from './dto/notification.dto';
import { NotificationLog, NotificationLogStatus } from './entities/notification-log.entity';
import { NotificationRecipient } from './entities/notification-recipient.entity';
import { NotificationSmtpConfig } from './entities/notification-smtp-config.entity';
import { NOTIFICATION_EVENT_INFO, NOTIFICATION_EVENTS, NotificationEvent } from './notification-events';

export interface OutgoingMail {
  branchId: number | null;
  event: NotificationEvent | string;
  to: string[];
  subject: string;
  html: string;
  ticketId?: number | null;
  ticketNumber?: string | null;
}

interface ResolvedTransport {
  transporter: Transporter;
  from: string;
  replyTo?: string | null;
  source: 'branch' | 'default';
  config: NotificationSmtpConfig | null;
}

const SMTP_TIMEOUTS = { connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000 };

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  /** Un transporte por sucursal; se descarta cuando cambia la configuración. */
  private readonly transports = new Map<number, { version: number; transporter: Transporter }>();
  private defaultTransporter: Transporter | null = null;

  constructor(
    @InjectRepository(NotificationSmtpConfig) private readonly configs: Repository<NotificationSmtpConfig>,
    @InjectRepository(NotificationRecipient) private readonly recipients: Repository<NotificationRecipient>,
    @InjectRepository(NotificationLog) private readonly logs: Repository<NotificationLog>,
    @InjectRepository(Sucursales) private readonly branches: Repository<Sucursales>,
  ) {}

  // ---------------------------------------------------------------- catálogo y resumen

  listEvents() {
    return NOTIFICATION_EVENTS.map((event) => ({ event, ...NOTIFICATION_EVENT_INFO[event] }));
  }

  /** Sucursales con el estado de su configuración (para la lista lateral de la pantalla). */
  async branchesOverview() {
    const [branches, configs, counts] = await Promise.all([
      this.branches.find({ order: { nombre: 'ASC' } }),
      this.configs.find(),
      this.recipients
        .createQueryBuilder('r')
        .select('r.branchId', 'branchId')
        .addSelect('COUNT(*)', 'total')
        .where('r.active = :active', { active: true })
        .groupBy('r.branchId')
        .getRawMany<{ branchId: number; total: string }>(),
    ]);
    const configByBranch = new Map(configs.map((c) => [c.branchId, c]));
    const countByBranch = new Map(counts.map((c) => [Number(c.branchId), Number(c.total)]));
    return branches.map((b) => {
      const c = configByBranch.get(b.id);
      return {
        branchId: b.id,
        branchName: b.nombre,
        smtpConfigured: !!c,
        enabled: c?.enabled ?? true,
        lastTestOk: c?.lastTestOk ?? null,
        recipientsCount: countByBranch.get(b.id) ?? 0,
        usesDefaultSmtp: !c && this.hasDefaultSmtp(),
      };
    });
  }

  async getBranchSettings(branchId: number) {
    await this.ensureBranch(branchId);
    const config = await this.configs
      .createQueryBuilder('c')
      .addSelect('c.passwordEncrypted')
      .where('c.branchId = :branchId', { branchId })
      .getOne();
    const recipients = await this.recipients.find({ where: { branchId }, order: { event: 'ASC', email: 'ASC' } });
    return {
      branchId,
      smtp: config ? this.toPublicConfig(config) : null,
      defaultSmtpAvailable: this.hasDefaultSmtp(),
      recipients,
      events: this.listEvents(),
    };
  }

  // ---------------------------------------------------------------- SMTP

  async upsertSmtp(branchId: number, dto: UpsertSmtpConfigDto, userId?: number) {
    await this.ensureBranch(branchId);
    const existing = await this.configs
      .createQueryBuilder('c')
      .addSelect('c.passwordEncrypted')
      .where('c.branchId = :branchId', { branchId })
      .getOne();
    const password = dto.password?.trim();
    if (!existing && !password) throw new BadRequestException('Escribe la contraseña del correo');

    const config = existing ?? this.configs.create({ branchId });
    Object.assign(config, {
      enabled: dto.enabled ?? config.enabled ?? true,
      host: dto.host.trim(),
      port: dto.port,
      secure: dto.secure,
      username: dto.username.trim(),
      fromEmail: dto.fromEmail.trim().toLowerCase(),
      fromName: dto.fromName?.trim() || config.fromName || 'Mesa de ayuda Propapel',
      replyTo: dto.replyTo?.trim() || null,
      notifyReporter: dto.notifyReporter ?? config.notifyReporter ?? false,
      notifyAssignedTechnician: dto.notifyAssignedTechnician ?? config.notifyAssignedTechnician ?? true,
      updatedById: userId ?? null,
    });
    if (password) config.passwordEncrypted = encryptSecret(password);
    // Los datos cambiaron: la última prueba ya no aplica
    config.lastTestAt = null;
    config.lastTestOk = null;
    config.lastTestError = null;
    const saved = await this.configs.save(config);
    this.transports.delete(branchId);
    return this.toPublicConfig(saved);
  }

  async deleteSmtp(branchId: number) {
    await this.configs.delete({ branchId });
    this.transports.delete(branchId);
    return { branchId, deleted: true };
  }

  /** Verifica la conexión y envía un correo real de prueba; guarda el resultado. */
  async testSmtp(branchId: number, to: string) {
    const resolved = await this.resolveTransport(branchId, true);
    if (!resolved) throw new BadRequestException('La sucursal no tiene servidor de correo configurado');
    const subject = 'Prueba de notificaciones · Mesa de ayuda';
    let ok = false;
    let error: string | null = null;
    try {
      await resolved.transporter.verify();
      await resolved.transporter.sendMail({
        from: resolved.from,
        replyTo: resolved.replyTo ?? undefined,
        to,
        subject,
        html: `<p>La configuración de correo de la sucursal funciona correctamente.</p>
               <p style="color:#5f6368;font-size:12px">Enviado desde ${resolved.source === 'branch' ? 'el SMTP de la sucursal' : 'la cuenta general'}.</p>`,
      });
      ok = true;
    } catch (e) {
      error = this.describeSmtpError(e);
    }
    if (resolved.config) {
      await this.configs.update(resolved.config.id, { lastTestAt: new Date(), lastTestOk: ok, lastTestError: error });
    }
    await this.writeLog({
      branchId, event: 'TEST', to: [to], subject, html: '', ticketId: null, ticketNumber: null,
    }, ok ? NotificationLogStatus.SENT : NotificationLogStatus.FAILED, error, resolved.source);
    if (!ok) throw new HttpException({ ok, message: error }, HttpStatus.BAD_GATEWAY);
    return { ok, message: `Correo de prueba enviado a ${to}` };
  }

  // ---------------------------------------------------------------- destinatarios

  async addRecipient(branchId: number, dto: CreateRecipientDto) {
    await this.ensureBranch(branchId);
    const email = dto.email.trim().toLowerCase();
    const exists = await this.recipients.findOneBy({ branchId, event: dto.event, email });
    if (exists) throw new HttpException('Ese correo ya recibe este aviso', HttpStatus.CONFLICT);
    return this.recipients.save(
      this.recipients.create({ branchId, event: dto.event, email, name: dto.name?.trim() || null, active: true }),
    );
  }

  async updateRecipient(id: number, dto: UpdateRecipientDto) {
    const recipient = await this.recipients.findOneBy({ id });
    if (!recipient) throw new NotFoundException('Destinatario no encontrado');
    if (dto.active !== undefined) recipient.active = dto.active;
    if (dto.name !== undefined) recipient.name = dto.name.trim() || null;
    return this.recipients.save(recipient);
  }

  async removeRecipient(id: number) {
    const result = await this.recipients.delete({ id });
    if (!result.affected) throw new NotFoundException('Destinatario no encontrado');
    return { id, deleted: true };
  }

  /** Copia la configuración de una sucursal a otras (SMTP, destinatarios o ambos). */
  async copyConfig(sourceBranchId: number, dto: CopyConfigDto, userId?: number) {
    const targets = [...new Set(dto.targetBranchIds)].filter((id) => id !== sourceBranchId);
    if (!targets.length) throw new BadRequestException('Elige al menos una sucursal destino');
    if (!dto.includeSmtp && !dto.includeRecipients) throw new BadRequestException('Elige qué copiar');
    const existing = await this.branches.findBy({ id: In(targets) });
    if (existing.length !== targets.length) throw new NotFoundException('Alguna sucursal destino no existe');

    const source = await this.configs
      .createQueryBuilder('c').addSelect('c.passwordEncrypted')
      .where('c.branchId = :branchId', { branchId: sourceBranchId }).getOne();
    if (dto.includeSmtp && !source) throw new BadRequestException('La sucursal origen no tiene SMTP configurado');
    const sourceRecipients = dto.includeRecipients ? await this.recipients.findBy({ branchId: sourceBranchId }) : [];

    await this.configs.manager.transaction(async (em) => {
      for (const branchId of targets) {
        if (dto.includeSmtp && source) {
          const { id, createdAt, updatedAt, lastTestAt, lastTestOk, lastTestError, ...rest } = source;
          const current = await em.findOneBy(NotificationSmtpConfig, { branchId });
          await em.save(NotificationSmtpConfig, {
            ...(current ?? {}),
            ...rest,
            branchId,
            updatedById: userId ?? null,
            lastTestAt: null, lastTestOk: null, lastTestError: null,
          });
          this.transports.delete(branchId);
        }
        if (dto.includeRecipients) {
          await em.delete(NotificationRecipient, { branchId });
          if (sourceRecipients.length) {
            await em.insert(
              NotificationRecipient,
              sourceRecipients.map((r) => ({ branchId, event: r.event, email: r.email, name: r.name, active: r.active })),
            );
          }
        }
      }
    });
    return { copiedTo: targets, includeSmtp: dto.includeSmtp, includeRecipients: dto.includeRecipients };
  }

  // ---------------------------------------------------------------- historial

  async findLogs(query: { page?: number; limit?: number; branchId?: number; status?: string; event?: string }, request?: Request) {
    const { page, limit, offset } = normalizePage(query.page, query.limit);
    const qb = this.logs.createQueryBuilder('log');
    if (query.branchId) qb.andWhere('log.branchId = :branchId', { branchId: query.branchId });
    if (query.status && Object.values(NotificationLogStatus).includes(query.status as NotificationLogStatus)) {
      qb.andWhere('log.status = :status', { status: query.status });
    }
    if (query.event) qb.andWhere('log.event = :event', { event: query.event });
    const [results, total] = await qb.orderBy('log.createdAt', 'DESC').addOrderBy('log.id', 'DESC')
      .skip(offset).take(limit).getManyAndCount();
    return toPagedResponse(results, total, page, limit, request);
  }

  // ---------------------------------------------------------------- envío

  /** Correos activos de un evento en la sucursal. */
  async recipientsFor(branchId: number, event: NotificationEvent): Promise<string[]> {
    const rows = await this.recipients.find({ where: { branchId, event, active: true }, select: ['email'] });
    return rows.map((r) => r.email);
  }

  /** Opciones de la sucursal (sin contraseña) para decidir a quién más avisar. */
  getBranchOptions(branchId: number) {
    return this.configs.findOneBy({ branchId });
  }

  /**
   * Envía un correo con el SMTP de la sucursal (o la cuenta general si no tiene) y lo registra.
   * Nunca lanza: un fallo de correo no debe romper la operación del ticket.
   */
  async send(mail: OutgoingMail): Promise<boolean> {
    const to = [...new Set(mail.to.map((t) => t?.trim().toLowerCase()).filter((t): t is string => !!t))];
    if (!to.length) return false;
    let resolved: ResolvedTransport | null = null;
    try {
      resolved = await this.resolveTransport(mail.branchId);
      if (!resolved) {
        await this.writeLog(mail, NotificationLogStatus.SKIPPED, 'Sin servidor de correo configurado o notificaciones apagadas', 'branch');
        return false;
      }
      await resolved.transporter.sendMail({
        from: resolved.from,
        replyTo: resolved.replyTo ?? undefined,
        // Un solo destinatario visible; el resto en copia oculta para no exponer correos entre sí
        to: to[0],
        bcc: to.slice(1),
        subject: mail.subject,
        html: mail.html,
      });
      await this.writeLog({ ...mail, to }, NotificationLogStatus.SENT, null, resolved.source);
      return true;
    } catch (e) {
      const error = this.describeSmtpError(e);
      this.logger.warn(`No se pudo enviar "${mail.subject}": ${error}`);
      await this.writeLog({ ...mail, to }, NotificationLogStatus.FAILED, error, resolved?.source ?? 'branch');
      return false;
    }
  }

  // ---------------------------------------------------------------- internos

  private hasDefaultSmtp() {
    return !!(process.env.MAIL_HOST && process.env.MAIL_USER && process.env.MAIL_PASS);
  }

  private async resolveTransport(branchId: number | null, forTest = false): Promise<ResolvedTransport | null> {
    const config = branchId
      ? await this.configs.createQueryBuilder('c').addSelect('c.passwordEncrypted')
          .where('c.branchId = :branchId', { branchId }).getOne()
      : null;

    if (config) {
      // Apagado a propósito: no se envía nada (salvo una prueba explícita)
      if (!config.enabled && !forTest) return null;
      if (!config.passwordEncrypted) return null;
      const version = config.updatedAt?.getTime() ?? 0;
      let cached = this.transports.get(config.branchId);
      if (!cached || cached.version !== version) {
        const transporter = nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: config.secure,
          auth: { user: config.username, pass: decryptSecret(config.passwordEncrypted) },
          ...SMTP_TIMEOUTS,
        });
        cached = { version, transporter };
        this.transports.set(config.branchId, cached);
      }
      return {
        transporter: cached.transporter,
        from: `"${config.fromName.replace(/"/g, '')}" <${config.fromEmail}>`,
        replyTo: config.replyTo,
        source: 'branch',
        config,
      };
    }

    if (!this.hasDefaultSmtp()) return null;
    this.defaultTransporter ??= nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT) || 587,
      secure: process.env.MAIL_SECURE === 'true',
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
      ...SMTP_TIMEOUTS,
    });
    return {
      transporter: this.defaultTransporter,
      from: `"Mesa de ayuda Propapel" <${process.env.MAIL_USER}>`,
      source: 'default',
      config: null,
    };
  }

  private async writeLog(
    mail: OutgoingMail,
    status: NotificationLogStatus,
    error: string | null,
    source: string,
  ) {
    try {
      await this.logs.insert({
        branchId: mail.branchId,
        event: String(mail.event),
        ticketId: mail.ticketId ?? null,
        ticketNumber: mail.ticketNumber ?? null,
        recipients: mail.to.join(', ').slice(0, 5000),
        subject: mail.subject.slice(0, 255),
        status,
        error: error?.slice(0, 2000) ?? null,
        smtpSource: source,
      });
    } catch (e) {
      this.logger.error('No se pudo guardar el historial de notificaciones', e as Error);
    }
  }

  /** Mensaje entendible para los errores SMTP más comunes. */
  private describeSmtpError(e: unknown): string {
    const err = e as { code?: string; responseCode?: number; message?: string };
    if (err?.code === 'EAUTH' || err?.responseCode === 535) return 'Usuario o contraseña del correo incorrectos';
    if (err?.code === 'ETIMEDOUT' || err?.code === 'ECONNECTION' || err?.code === 'ESOCKET') {
      return 'No se pudo conectar al servidor de correo (revisa servidor, puerto y seguridad)';
    }
    if (err?.code === 'EENVELOPE') return 'El servidor rechazó algún destinatario';
    if (err?.message?.includes('NOTIFICATIONS_SECRET')) return err.message;
    return err?.message?.slice(0, 300) || 'Error desconocido al enviar el correo';
  }

  private toPublicConfig(c: NotificationSmtpConfig) {
    const { passwordEncrypted, ...rest } = c;
    return { ...rest, hasPassword: !!passwordEncrypted };
  }

  private async ensureBranch(branchId: number) {
    const exists = await this.branches.count({ where: { id: branchId } });
    if (exists === 0) throw new NotFoundException('Sucursal no encontrada');
  }
}
