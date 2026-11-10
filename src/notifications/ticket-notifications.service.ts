import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { safeUserSelect } from '../common/pagination/paged-response';
import { Ticket } from '../ticket/entities/ticket.entity';
import { NotificationEvent } from './notification-events';
import { renderTicketEmail } from './notification-email.template';
import { NotificationsService } from './notifications.service';

const STATUS_LABEL: Record<string, string> = {
  SIN_ASIGNAR: 'Sin asignar',
  PENDING_CLOSE: 'Pendiente de cierre',
  ASIGNADO: 'Asignado',
  EN_PROCESO: 'En proceso',
  EN_ESPERA: 'En espera',
  RESUELTO: 'Resuelto',
  CANCELADO: 'Cancelado',
  TRAVEL: 'En camino',
  IN_REMOTE: 'Atención remota',
  ON_SITE: 'En sitio',
  SUPPORT_REQUEST: 'Solicitud de apoyo',
};

const PUBLIC_URL = () => (process.env.PUBLIC_WEB_URL || 'https://www.erppropapel.com').replace(/\/$/, '');

/**
 * Envía los correos de los eventos de tickets según la configuración de cada sucursal.
 * Se llama sin await desde TicketService: la respuesta al usuario no espera al correo.
 */
@Injectable()
export class TicketNotificationsService {
  private readonly logger = new Logger(TicketNotificationsService.name);

  constructor(
    @InjectRepository(Ticket) private readonly tickets: Repository<Ticket>,
    private readonly notifications: NotificationsService,
  ) {}

  /** Programa el envío y regresa de inmediato. Nunca lanza. */
  dispatch(event: NotificationEvent, ticketId: number | undefined | null, detail?: string) {
    if (!ticketId) return;
    setImmediate(() => {
      this.handle(event, ticketId, detail).catch((e) =>
        this.logger.warn(`Notificación ${event} del ticket ${ticketId} falló: ${(e as Error).message}`),
      );
    });
  }

  private async handle(event: NotificationEvent, ticketId: number, detail?: string) {
    const ticket = await this.tickets
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.sucursal', 'sucursal')
      .leftJoinAndSelect('ticket.cliente', 'cliente')
      .leftJoin('ticket.createdBy', 'createdBy')
      .addSelect(safeUserSelect('createdBy'))
      .leftJoin('ticket.assigmentsTechnical', 'tech')
      .addSelect(safeUserSelect('tech'))
      .where('ticket.id = :ticketId', { ticketId })
      .getOne();
    if (!ticket) return;

    const branchId = ticket.sucursal?.id ?? null;
    const [staff, options] = branchId
      ? await Promise.all([this.notifications.recipientsFor(branchId, event), this.notifications.getBranchOptions(branchId)])
      : [[], null];

    const technicians = (ticket.assigmentsTechnical ?? []).map((t) => `${t.name ?? ''} ${t.lastname ?? ''}`.trim()).filter(Boolean);
    const status = STATUS_LABEL[ticket.status] ?? ticket.status;
    const rows: [string, string | null | undefined][] = [
      ['Cliente', ticket.cliente ? `${ticket.cliente.numberOfClient} · ${ticket.cliente.razonSocial}` : ticket.nameCommercial],
      ['Reportó', ticket.nameReported],
      ['Teléfono', ticket.phoneReport],
      ['Correo', ticket.emailReport],
      ['Área / departamento', ticket.apartamentReport],
      ['Ubicación', ticket.location],
      ['Estado', status],
      ['Técnico', technicians.join(', ') || null],
      ['Descripción', ticket.reasonReport],
      ['Detalle', detail],
    ];
    const copy = this.copyFor(event, ticket.ticketNumber, status, technicians);
    const html = renderTicketEmail({
      title: copy.title,
      intro: copy.intro,
      ticketNumber: ticket.ticketNumber,
      rows,
      branchName: ticket.sucursal?.nombre,
    });

    // Personal configurado (+ técnicos asignados si la sucursal lo pidió)
    const internal = [...staff];
    if (event === NotificationEvent.TICKET_ASSIGNED && options?.notifyAssignedTechnician) {
      internal.push(...(ticket.assigmentsTechnical ?? []).map((t) => t.email).filter(Boolean));
    }
    await this.notifications.send({
      branchId, event, to: internal, subject: copy.subject, html, ticketId: ticket.id, ticketNumber: ticket.ticketNumber,
    });

    // Quien reportó recibe su propio correo con el enlace para seguir su ticket
    const reporterEvents = [NotificationEvent.TICKET_CREATED, NotificationEvent.TICKET_STATUS_CHANGED, NotificationEvent.TICKET_CLOSED];
    if (options?.notifyReporter && ticket.emailReport?.includes('@') && reporterEvents.includes(event)) {
      const reporterHtml = renderTicketEmail({
        title: copy.title,
        intro: copy.reporterIntro,
        ticketNumber: ticket.ticketNumber,
        rows: [['Estado', status], ['Técnico', technicians.join(', ') || null], ['Descripción', ticket.reasonReport]],
        branchName: ticket.sucursal?.nombre,
        actionUrl: ticket.statusToken ? `${PUBLIC_URL()}/ticket/checkStatus/${ticket.statusToken}` : null,
        actionLabel: 'Ver el estado de mi ticket',
      });
      await this.notifications.send({
        branchId, event: `${event}_REPORTER`, to: [ticket.emailReport], subject: copy.subject, html: reporterHtml,
        ticketId: ticket.id, ticketNumber: ticket.ticketNumber,
      });
    }
  }

  private copyFor(event: NotificationEvent, number: string, status: string, technicians: string[]) {
    switch (event) {
      case NotificationEvent.TICKET_CREATED:
        return {
          subject: `Nuevo ticket #${number}`,
          title: 'Nuevo ticket',
          intro: 'Se levantó un ticket nuevo en la sucursal. Estos son los datos del reporte:',
          reporterIntro: 'Recibimos tu reporte. Te avisaremos por este medio cuando haya avances.',
        };
      case NotificationEvent.TICKET_ASSIGNED:
        return {
          subject: `Ticket #${number} asignado a ${technicians.join(', ') || 'un técnico'}`,
          title: 'Técnico asignado',
          intro: 'Se asignó un técnico a este ticket.',
          reporterIntro: 'Un técnico ya está atendiendo tu reporte.',
        };
      case NotificationEvent.TICKET_CLOSED:
        return {
          subject: `Ticket #${number} cerrado`,
          title: 'Ticket cerrado',
          intro: 'El ticket se resolvió y se cerró.',
          reporterIntro: 'Tu reporte quedó resuelto. Gracias por tu paciencia.',
        };
      default:
        return {
          subject: `Ticket #${number}: ${status}`,
          title: `Ticket ${status.toLowerCase()}`,
          intro: `El ticket cambió a "${status}".`,
          reporterIntro: `Tu reporte cambió a "${status}".`,
        };
    }
  }
}
