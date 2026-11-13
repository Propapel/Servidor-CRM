import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reminder } from '../remider/entity/remider.entity';
import { PushService } from './push.service';

/** Minutos antes de la cita en que llega el aviso. */
const REMINDER_LEAD_MINUTES = Number(process.env.PUSH_REMINDER_MINUTES) || 15;
/** Zona horaria de las citas (la app las guarda como hora local). */
const APP_TIMEZONE = process.env.APP_TIMEZONE || 'America/Mexico_City';

const TYPE_LABEL: Record<string, string> = {
  Presencial: 'Visita presencial',
  Llamada: 'Llamada',
  'Reunion Remota': 'Reunión remota',
  'Correo electronico': 'Correo',
};

/**
 * Las fechas de citas se guardan como "hora local escrita como si fuera UTC" (así las arma la app).
 * Esto regresa la hora actual de la zona de la empresa en ese mismo formato para poder compararlas.
 */
export function wallClockAsUtcMs(now: Date = new Date(), timeZone = APP_TIMEZONE): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(now).map((p) => [p.type, p.value]),
  );
  return Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
}

function hhmm(encoded: number) {
  const d = new Date(encoded);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes().toString().padStart(2, '0');
  return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h < 12 ? 'a. m.' : 'p. m.'}`;
}

const REVIEW_COPY: Record<string, (company: string) => { title: string; body: string }> = {
  REASSIGNED: (c) => ({ title: 'Te asignaron un lead', body: c }),
  IN_PROGRESS: (c) => ({ title: 'Tu lead fue aceptado', body: `${c} ya está en seguimiento` }),
  DISCARDED: (c) => ({ title: 'Tu lead fue descartado', body: c }),
  REVIEWED: (c) => ({ title: 'Tu gerente revisó tu lead', body: c }),
};

/** Avisos push del CRM: citas próximas, revisión del gerente, mensajes y notas de un lead. Nunca lanza. */
@Injectable()
export class LeadPushService {
  private readonly logger = new Logger(LeadPushService.name);
  private running = false;

  constructor(
    @InjectRepository(Reminder) private readonly reminders: Repository<Reminder>,
    private readonly push: PushService,
  ) {}

  /** Cada minuto: citas pendientes que empiezan en los próximos minutos y que aún no se avisaron. */
  @Cron(CronExpression.EVERY_MINUTE, { name: 'push-citas-proximas' })
  async notifyUpcomingReminders() {
    if (this.running || process.env.PUSH_REMINDERS === 'off') return;
    this.running = true;
    try {
      const now = wallClockAsUtcMs();
      const due = await this.reminders
        .createQueryBuilder('r')
        .innerJoinAndSelect('r.customer', 'customer')
        .innerJoin('customer.user', 'owner')
        .addSelect(['owner.id'])
        .where('r.is_completed = :done', { done: false })
        .andWhere('r.push_notified_at IS NULL')
        // Un margen hacia atrás por si el servidor se reinició justo a la hora de la cita
        .andWhere('r.reminder_date BETWEEN :from AND :to', { from: now - 5 * 60_000, to: now + REMINDER_LEAD_MINUTES * 60_000 })
        .take(200)
        .getMany();

      for (const reminder of due) {
        const ownerId = reminder.customer?.user?.id;
        // Se marca primero para no repetir el aviso aunque el envío falle
        await this.reminders.update({ reminder_id: reminder.reminder_id }, { push_notified_at: new Date() });
        if (!ownerId) continue;
        const encoded = Number(reminder.reminder_date);
        const minutes = Math.round((encoded - now) / 60_000);
        const when = minutes > 1 ? `en ${minutes} min` : 'ahora';
        const type = TYPE_LABEL[reminder.typeAppointment] ?? reminder.typeAppointment;
        await this.push.sendToUsers([ownerId], {
          title: `${type} ${when}: ${reminder.customer.company_name}`,
          body: [hhmm(encoded), reminder.description?.trim()].filter(Boolean).join(' · '),
          data: {
            type: 'REMINDER_DUE',
            reminderId: String(reminder.reminder_id),
            customerId: String(reminder.customer.customer_id),
          },
          category: 'leads',
        });
      }
    } catch (e) {
      this.logger.warn(`No se pudieron revisar las citas próximas: ${(e as Error).message}`);
    } finally {
      this.running = false;
    }
  }

  /** El gerente aceptó, descartó, revisó o reasignó el lead: se avisa al ejecutivo dueño. */
  leadReviewed(input: { customerId: number; companyName: string; ownerId?: number | null; status: string; managerId?: number | null; notes?: string }) {
    this.fire(async () => {
      if (!input.ownerId || input.ownerId === input.managerId) return;
      const copy = (REVIEW_COPY[input.status] ?? REVIEW_COPY.REVIEWED)(input.companyName);
      await this.push.sendToUsers([input.ownerId], {
        title: copy.title,
        body: [copy.body, input.notes?.trim()].filter(Boolean).join(' · ').slice(0, 300),
        data: { type: 'LEAD_REVIEW', status: input.status, customerId: String(input.customerId) },
        category: 'leads',
      });
    });
  }

  /** Mensaje en la conversación de un lead: a los demás participantes. */
  leadMessage(input: { customerId?: number | null; companyName?: string; conversationId: number; senderId: number; senderName: string; recipientIds: number[]; content: string }) {
    this.fire(async () => {
      const ids = [...new Set(input.recipientIds)].filter((id) => id && id !== input.senderId);
      if (!ids.length) return;
      await this.push.sendToUsers(ids, {
        title: input.companyName ? `${input.senderName} · ${input.companyName}` : input.senderName,
        body: input.content.trim().slice(0, 200) || 'Nuevo mensaje',
        data: {
          type: 'LEAD_MESSAGE',
          conversationId: String(input.conversationId),
          customerId: input.customerId ? String(input.customerId) : '',
        },
        category: 'chat',
      });
    });
  }

  /** Nota nueva en un lead escrita por alguien que no es el dueño (por ejemplo, el gerente). */
  leadNote(input: { customerId: number; companyName: string; ownerId?: number | null; authorId?: number | null; authorName: string; content: string }) {
    this.fire(async () => {
      if (!input.ownerId || input.ownerId === input.authorId) return;
      await this.push.sendToUsers([input.ownerId], {
        title: `${input.authorName} dejó una nota en ${input.companyName}`,
        body: input.content.trim().slice(0, 200),
        data: { type: 'LEAD_NOTE', customerId: String(input.customerId) },
        category: 'leads',
      });
    });
  }

  /** Bandeja: borra avisos de más de 90 días una vez al día. */
  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: 'push-limpiar-bandeja' })
  async purgeInbox() {
    const removed = await this.push.purgeOldInbox().catch(() => 0);
    if (removed) this.logger.log(`Se borraron ${removed} avisos antiguos de la bandeja`);
  }

  private fire(task: () => Promise<void>) {
    setImmediate(() => task().catch((e) => this.logger.warn(`Push de lead falló: ${(e as Error).message}`)));
  }
}
