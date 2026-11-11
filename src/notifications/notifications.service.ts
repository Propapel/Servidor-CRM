import { BadRequestException, HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as net from 'net';
import * as nodemailer from 'nodemailer';
import { Request } from 'express';
import { In, Repository } from 'typeorm';
import { Sucursales } from '../sucursales/entities/sucursale.entity';
import { normalizePage, toPagedResponse } from '../common/pagination/paged-response';
import { decryptSecret, encryptSecret } from './crypto.util';
import { BrevoApiError, BrevoMailSender, describeBrevoError, MailSender, SmtpMailSender } from './mail-senders';
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
  sender: MailSender;
  fromName: string;
  fromEmail: string;
  replyTo?: string | null;
  source: 'branch' | 'default';
  config: NotificationSmtpConfig | null;
}

const SMTP_TIMEOUTS = { connectionTimeout: 15_000, greetingTimeout: 15_000, socketTimeout: 30_000 };
const SMTP_CONNECT_TIMEOUT_MS = 10_000;
const SMTP_TEST_TIMEOUT_MS = 45_000;

interface SmtpTestResult {
  ok: boolean;
  step: 'config' | 'dns' | 'connect' | 'tls' | 'auth' | 'send' | 'sent';
  message: string;
  detail: string | null;
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: NodeJS.Timeout;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); }),
  ]);
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  /** Un transporte por sucursal; se descarta cuando cambia la configuración. */
  private readonly transports = new Map<number, { version: number; sender: MailSender }>();
  private defaultSender: MailSender | null = null;

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
        provider: c?.provider ?? null,
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
      .addSelect(['c.passwordEncrypted', 'c.apiKeyEncrypted'])
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
      .addSelect(['c.passwordEncrypted', 'c.apiKeyEncrypted'])
      .where('c.branchId = :branchId', { branchId })
      .getOne();
    const provider = dto.provider ?? 'smtp';
    const password = dto.password?.trim();
    const apiKey = dto.apiKey?.trim();
    if (provider === 'smtp' && !password && !existing?.passwordEncrypted) {
      throw new BadRequestException('Escribe la contraseña del correo');
    }
    if (provider === 'brevo' && !apiKey && !existing?.apiKeyEncrypted) {
      throw new BadRequestException('Escribe la API key de Brevo');
    }

    const config = existing ?? this.configs.create({ branchId });
    Object.assign(config, {
      provider,
      enabled: dto.enabled ?? config.enabled ?? true,
      // Con Brevo no se usan servidor/usuario SMTP (se conservan por si se regresa a SMTP)
      host: dto.host?.trim() ?? config.host ?? '',
      port: dto.port ?? config.port ?? 587,
      secure: dto.secure ?? config.secure ?? false,
      username: dto.username?.trim() ?? config.username ?? '',
      fromEmail: dto.fromEmail.trim().toLowerCase(),
      fromName: dto.fromName?.trim() || config.fromName || 'Mesa de ayuda Propapel',
      replyTo: dto.replyTo?.trim() || null,
      notifyReporter: dto.notifyReporter ?? config.notifyReporter ?? false,
      notifyAssignedTechnician: dto.notifyAssignedTechnician ?? config.notifyAssignedTechnician ?? true,
      updatedById: userId ?? null,
    });
    if (password) config.passwordEncrypted = encryptSecret(password);
    if (apiKey) config.apiKeyEncrypted = encryptSecret(apiKey);
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

  /**
   * Envía un correo real de prueba y explica en qué paso falló si algo sale mal.
   * Responde siempre 200 con { ok, step, message, detail }: así ningún proxy (Railway, Cloudflare)
   * reemplaza el mensaje y la app muestra el motivo exacto.
   */
  async testSmtp(branchId: number, to: string) {
    const resolved = await this.resolveTransport(branchId, true);
    if (!resolved) throw new BadRequestException('La sucursal no tiene servidor de correo configurado');
    const subject = 'Prueba de notificaciones · Mesa de ayuda';
    const host = resolved.config?.host ?? process.env.MAIL_HOST ?? '';
    const port = resolved.config?.port ?? (Number(process.env.MAIL_PORT) || 587);

    const isBrevo = resolved.sender.kind === 'brevo';
    // 1) SMTP: ¿el servidor de la app puede abrir conexión? (DNS + puerto). Brevo va por HTTPS.
    let result: SmtpTestResult = isBrevo
      ? { ok: true, step: 'connect', message: 'Brevo (API HTTPS)', detail: null }
      : await this.probeConnection(host, port);

    // 2) Inicio de sesión y envío en una sola conexión (antes eran dos y la app se quedaba esperando)
    if (result.ok) {
      try {
        await withTimeout(
          resolved.sender.send({
            fromName: resolved.fromName,
            fromEmail: resolved.fromEmail,
            replyTo: resolved.replyTo,
            to,
            bcc: [],
            subject,
            html: `<p>La configuración de correo de la sucursal funciona correctamente.</p>
                   <p style="color:#5f6368;font-size:12px">Enviado desde ${resolved.source === 'branch' ? 'la configuración de la sucursal' : 'la cuenta general'} (${isBrevo ? 'Brevo' : `${host}:${port}`}).</p>`,
          }),
          SMTP_TEST_TIMEOUT_MS,
          'El servidor de correo tardó demasiado en responder',
        );
        result = { ok: true, step: 'sent', message: `Correo de prueba enviado a ${to}`, detail: null };
      } catch (e) {
        if (e instanceof BrevoApiError) {
          const described = describeBrevoError(e, resolved.fromEmail);
          result = { ok: false, step: described.step, message: described.message, detail: `${e.status} ${e.code ?? ''} ${e.message}`.trim() };
        } else {
          result = { ok: false, step: this.failedStep(e), message: this.describeSmtpError(e, resolved.config?.username, resolved.config?.fromEmail), detail: this.rawSmtpError(e) };
        }
      }
    }

    const error = result.ok ? null : [result.message, result.detail].filter(Boolean).join(' · ');
    if (resolved.config) {
      await this.configs.update(resolved.config.id, { lastTestAt: new Date(), lastTestOk: result.ok, lastTestError: error })
        .catch(() => undefined);
    }
    await this.writeLog({ branchId, event: 'TEST', to: [to], subject, html: '', ticketId: null, ticketNumber: null },
      result.ok ? NotificationLogStatus.SENT : NotificationLogStatus.FAILED, error, resolved.source);
    return { ...result, provider: resolved.sender.kind, host: isBrevo ? 'api.brevo.com' : host, port: isBrevo ? 443 : port, source: resolved.source };
  }

  /** Abre un socket TCP al servidor SMTP para distinguir "no hay conexión" de "credenciales malas". */
  private probeConnection(host: string, port: number): Promise<SmtpTestResult> {
    return new Promise((resolve) => {
      if (!host) {
        resolve({ ok: false, step: 'config', message: 'Falta el servidor SMTP', detail: null });
        return;
      }
      const socket = net.createConnection({ host, port });
      const done = (r: SmtpTestResult) => {
        socket.removeAllListeners();
        socket.destroy();
        resolve(r);
      };
      socket.setTimeout(SMTP_CONNECT_TIMEOUT_MS);
      socket.once('connect', () => done({ ok: true, step: 'connect', message: 'Conexión correcta', detail: null }));
      socket.once('timeout', () => done({
        ok: false, step: 'connect',
        message: `El servidor de la app no pudo conectarse a ${host}:${port} (sin respuesta). Revisa servidor y puerto; ` +
          'si son correctos, el hosting puede estar bloqueando la salida SMTP (prueba 465 o 2525).',
        detail: 'ETIMEDOUT',
      }));
      socket.once('error', (err: NodeJS.ErrnoException) => done({
        ok: false, step: err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN' ? 'dns' : 'connect',
        message: err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN'
          ? `No existe el servidor "${host}". Revisa que esté bien escrito.`
          : `No se pudo conectar a ${host}:${port} (${err.code ?? err.message}). Revisa servidor y puerto.`,
        detail: `${err.code ?? ''} ${err.message}`.trim(),
      }));
    });
  }

  private failedStep(e: unknown): SmtpTestResult['step'] {
    const err = e as { code?: string; command?: string };
    if (err?.code === 'EAUTH') return 'auth';
    if (err?.code === 'EENVELOPE' || err?.command === 'MAIL FROM' || err?.command === 'RCPT TO' || err?.command === 'DATA') return 'send';
    if (err?.code === 'ETLS' || /ssl|tls|wrong version/i.test(String((e as Error)?.message))) return 'tls';
    return 'send';
  }

  private rawSmtpError(e: unknown): string | null {
    const err = e as { response?: string; responseCode?: number; code?: string; message?: string };
    return (err?.response ?? err?.message ?? null)?.toString().slice(0, 300) ?? null;
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
      .createQueryBuilder('c').addSelect(['c.passwordEncrypted', 'c.apiKeyEncrypted'])
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
      // Un solo destinatario visible; el resto en copia oculta para no exponer correos entre sí
      await resolved.sender.send({
        fromName: resolved.fromName,
        fromEmail: resolved.fromEmail,
        replyTo: resolved.replyTo,
        to: to[0],
        bcc: to.slice(1),
        subject: mail.subject,
        html: mail.html,
      });
      await this.writeLog({ ...mail, to }, NotificationLogStatus.SENT, null, resolved.source);
      return true;
    } catch (e) {
      const error = e instanceof BrevoApiError ? describeBrevoError(e, resolved?.fromEmail).message : this.describeSmtpError(e);
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
      ? await this.configs.createQueryBuilder('c').addSelect(['c.passwordEncrypted', 'c.apiKeyEncrypted'])
          .where('c.branchId = :branchId', { branchId }).getOne()
      : null;

    if (config) {
      // Apagado a propósito: no se envía nada (salvo una prueba explícita)
      if (!config.enabled && !forTest) return null;
      const isBrevo = config.provider === 'brevo';
      const secret = isBrevo ? config.apiKeyEncrypted : config.passwordEncrypted;
      if (!secret) return null;
      const version = (config.updatedAt?.getTime() ?? 0) + (isBrevo ? 1 : 0);
      let cached = this.transports.get(config.branchId);
      if (!cached || cached.version !== version) {
        const sender: MailSender = isBrevo
          ? new BrevoMailSender(decryptSecret(secret))
          : new SmtpMailSender(nodemailer.createTransport({
              host: config.host,
              port: config.port,
              secure: config.secure,
              auth: { user: config.username, pass: decryptSecret(secret) },
              ...SMTP_TIMEOUTS,
            }));
        cached = { version, sender };
        this.transports.set(config.branchId, cached);
      }
      return {
        sender: cached.sender,
        fromName: config.fromName.replace(/"/g, ''),
        fromEmail: config.fromEmail,
        replyTo: config.replyTo,
        source: 'branch',
        config,
      };
    }

    if (!this.hasDefaultSmtp()) return null;
    this.defaultSender ??= new SmtpMailSender(nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT) || 587,
      secure: process.env.MAIL_SECURE === 'true',
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
      ...SMTP_TIMEOUTS,
    }));
    return {
      sender: this.defaultSender,
      fromName: 'Mesa de ayuda Propapel',
      fromEmail: process.env.MAIL_USER ?? '',
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
  private describeSmtpError(e: unknown, username?: string, fromEmail?: string): string {
    const err = e as { code?: string; responseCode?: number; response?: string; message?: string };
    const response = `${err?.response ?? ''} ${err?.message ?? ''}`;
    if (err?.code === 'EAUTH' || err?.responseCode === 535 || err?.responseCode === 534) {
      return /application-specific|app password|5\.7\.9|AUTH.*disabled|SmtpClientAuthentication/i.test(response)
        ? 'El proveedor pide una contraseña de aplicación o tiene desactivado SMTP AUTH para esta cuenta'
        : 'Usuario o contraseña del correo incorrectos';
    }
    if (/SendAsDenied|not allowed to send|sender address rejected|5\.7\.60|553/i.test(response)
      || ((err?.responseCode === 550 || err?.responseCode === 554) && /send|sender|from/i.test(response))) {
      return `El servidor no permite enviar como ${fromEmail ?? 'ese remitente'}. Usa como remitente el mismo correo del usuario SMTP${username ? ` (${username})` : ''}`;
    }
    if (/wrong version number|ssl3_get_record|EPROTO/i.test(response)) {
      return 'La seguridad no coincide con el puerto: usa SSL/TLS con 465 y desactívalo con 587';
    }
    if (err?.code === 'ETIMEDOUT' || err?.code === 'ECONNECTION' || err?.code === 'ESOCKET' || /tardó demasiado/.test(response)) {
      return 'El servidor de correo no respondió a tiempo (revisa servidor, puerto y seguridad)';
    }
    if (err?.code === 'EENVELOPE') return 'El servidor rechazó algún destinatario';
    if (err?.message?.includes('NOTIFICATIONS_SECRET')) return err.message;
    return err?.message?.slice(0, 300) || 'Error desconocido al enviar el correo';
  }

  private toPublicConfig(c: NotificationSmtpConfig) {
    const { passwordEncrypted, apiKeyEncrypted, ...rest } = c;
    return { ...rest, provider: c.provider ?? 'smtp', hasPassword: !!passwordEncrypted, hasApiKey: !!apiKeyEncrypted };
  }

  private async ensureBranch(branchId: number) {
    const exists = await this.branches.count({ where: { id: branchId } });
    if (exists === 0) throw new NotFoundException('Sucursal no encontrada');
  }
}
