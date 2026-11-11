import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as admin from 'firebase-admin';
import { In, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { RegisterDeviceDto } from './dto/push.dto';
import { PushDevice } from './entities/push-device.entity';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
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
    if (!ids.length || !admin.apps.length) return { sent: 0, failed: 0 };
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
          data: payload.data ?? {},
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
