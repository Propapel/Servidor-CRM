import { Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as admin from 'firebase-admin';
import { In, IsNull, LessThan, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { RegisterDeviceDto } from './dto/push.dto';
import { PushDevice } from './entities/push-device.entity';
import { NotificationCategory, UserNotification } from './entities/user-notification.entity';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  /** tickets, leads, chat o system: la app permite apagar cada categoría. */
  category?: NotificationCategory;
  /** false = no guardar en la bandeja (por ejemplo, la prueba de notificación). */
  inbox?: boolean;
}

/** Errores de FCM que significan "este token ya no sirve": se borra. */
const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    @InjectRepository(PushDevice) private readonly devices: Repository<PushDevice>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @Optional() @InjectRepository(UserNotification) private readonly inbox?: Repository<UserNotification>,
  ) {}

  /** Registra (o mueve al usuario actual) el token de un equipo. */
  async registerDevice(userId: number, dto: RegisterDeviceDto) {
    const token = dto.token.trim();
    const existing = await this.devices.findOneBy({ token });
    const device = existing ?? this.devices.create({ token });
    Object.assign(device, {
      userId, // si el equipo lo usaba otra persona, ahora es de quien inició sesión
      platform: dto.platform,
      deviceName: dto.deviceName?.trim() || null,
      appVersion: dto.appVersion?.trim() || null,
      lastSeenAt: new Date(),
    });
    const saved = await this.devices.save(device);
    return { id: saved.id, platform: saved.platform, registered: true };
  }

  /** Al cerrar sesión: este equipo deja de recibir avisos del usuario. */
  async unregisterDevice(userId: number, token: string) {
    const result = await this.devices.delete({ token: token.trim(), userId });
    return { removed: (result.affected ?? 0) > 0 };
  }

  async devicesOf(userId: number) {
    return this.devices.find({ where: { userId }, order: { lastSeenAt: 'DESC' } });
  }

  /**
   * Envía a todos los equipos de esos usuarios (tabla push_device + el campo antiguo users.fcmToken).
   * Nunca lanza: si Firebase no está configurado o falla, solo se registra en el log.
   */
  async sendToUsers(userIds: number[], payload: PushPayload): Promise<{ sent: number; failed: number }> {
    const ids = [...new Set(userIds.filter((id) => Number.isInteger(id) && id > 0))];
    if (!ids.length) return { sent: 0, failed: 0 };
    const category = payload.category ?? 'system';
    const data: Record<string, string> = { ...(payload.data ?? {}), category };
    // La bandeja se guarda aunque Firebase no esté configurado o el usuario no tenga equipos
    if (payload.inbox !== false) await this.saveToInbox(ids, payload.title, payload.body, category, data);
    if (!admin.apps.length) return { sent: 0, failed: 0 };
    try {
      const [devices, legacy] = await Promise.all([
        this.devices.find({ where: { userId: In(ids) }, select: ['token'] }),
        this.users.find({ where: { id: In(ids) }, select: ['id', 'fcmToken'] }),
      ]);
      const tokens = [
        ...new Set([...devices.map((d) => d.token), ...legacy.map((u) => u.fcmToken).filter((t): t is string => !!t?.trim())]),
      ];
      if (!tokens.length) return { sent: 0, failed: 0 };

      let sent = 0;
      let failed = 0;
      const dead: string[] = [];
      for (let i = 0; i < tokens.length; i += 500) {
        const chunk = tokens.slice(i, i + 500);
        const response = await admin.messaging().sendEachForMulticast({
          tokens: chunk,
          notification: { title: payload.title, body: payload.body },
          data,
          android: { priority: 'high', notification: { channelId: 'tickets' } },
          // Escritorio (fcm-desktop) recibe como Web Push: urgencia alta y 1 día de vigencia
          webpush: { headers: { TTL: '86400', Urgency: 'high' } },
          apns: { payload: { aps: { sound: 'default' } } },
        });
        sent += response.successCount;
        failed += response.failureCount;
        response.responses.forEach((r, idx) => {
          if (!r.success && DEAD_TOKEN_CODES.has(r.error?.code ?? '')) dead.push(chunk[idx]);
        });
      }
      if (dead.length) await this.removeDeadTokens(dead);
      return { sent, failed };
    } catch (e) {
      this.logger.warn(`No se pudo enviar el push "${payload.title}": ${(e as Error).message}`);
      return { sent: 0, failed: userIds.length };
    }
  }

  // ------------------------------------------------------------------ bandeja

  private async saveToInbox(userIds: number[], title: string, body: string, category: NotificationCategory, data: Record<string, string>) {
    if (!this.inbox) return;
    try {
      const type = data.type ?? data.event ?? 'GENERIC';
      await this.inbox.insert(
        userIds.map((userId) => ({
          userId, category, type: type.slice(0, 40), title: title.slice(0, 200), body: (body ?? '').slice(0, 500), data,
        })),
      );
    } catch (e) {
      this.logger.warn(`No se pudo guardar el aviso en la bandeja: ${(e as Error).message}`);
    }
  }

  /** Avisos del usuario, más recientes primero. */
  async inboxOf(userId: number, page = 1, limit = 20, unreadOnly = false) {
    if (!this.inbox) return { items: [], page: 1, limit, total: 0, unread: 0 };
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;
    const where: any = { userId };
    if (unreadOnly) where.readAt = IsNull();
    const [items, total] = await this.inbox.findAndCount({ where, order: { createdAt: 'DESC', id: 'DESC' }, take, skip });
    const unread = await this.inbox.count({ where: { userId, readAt: IsNull() } });
    return { items, page: Math.max(page, 1), limit: take, total, unread };
  }

  async unreadCount(userId: number) {
    if (!this.inbox) return { unread: 0 };
    return { unread: await this.inbox.count({ where: { userId, readAt: IsNull() } }) };
  }

  async markRead(userId: number, id: number) {
    if (!this.inbox) return { read: false };
    const found = await this.inbox.findOneBy({ id, userId });
    if (!found) throw new NotFoundException('Aviso no encontrado');
    if (!found.readAt) await this.inbox.update({ id, userId }, { readAt: new Date() });
    return { read: true };
  }

  async markAllRead(userId: number) {
    if (!this.inbox) return { updated: 0 };
    const result = await this.inbox.update({ userId, readAt: IsNull() }, { readAt: new Date() });
    return { updated: result.affected ?? 0 };
  }

  /** Avisos de más de 90 días se borran (se llama desde el cron diario). */
  async purgeOldInbox(days = 90) {
    if (!this.inbox) return 0;
    const result = await this.inbox.delete({ createdAt: LessThan(new Date(Date.now() - days * 86_400_000)) });
    return result.affected ?? 0;
  }

  private async removeDeadTokens(tokens: string[]) {
    try {
      await this.devices.delete({ token: In(tokens) });
      await this.users.createQueryBuilder().update(User).set({ fcmToken: null })
        .where('fcmToken IN (:...tokens)', { tokens }).execute();
      this.logger.log(`Se quitaron ${tokens.length} token(s) push que ya no existen`);
    } catch (e) {
      this.logger.warn(`No se pudieron limpiar tokens push: ${(e as Error).message}`);
    }
  }
}
