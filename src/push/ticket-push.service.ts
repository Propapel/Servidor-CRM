import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../ticket/entities/ticket.entity';
import { User } from '../users/user.entity';
import { PushService } from './push.service';

export type TicketPushEvent = 'TICKET_CREATED' | 'TICKET_ASSIGNED' | 'TICKET_STATUS_CHANGED' | 'TICKET_CLOSED';

/** Técnicos (5) y gerentes de soporte (6) reciben los tickets nuevos de su sucursal. */
const NEW_TICKET_ROLE_IDS = ['5', '6'];

const STATUS_LABEL: Record<string, string> = {
  SIN_ASIGNAR: 'Sin asignar', PENDING_CLOSE: 'Pendiente de cierre', ASIGNADO: 'Asignado', EN_PROCESO: 'En proceso',
  EN_ESPERA: 'En espera', RESUELTO: 'Resuelto', CANCELADO: 'Cancelado', TRAVEL: 'En camino', IN_REMOTE: 'Atención remota',
  ON_SITE: 'En sitio', SUPPORT_REQUEST: 'Solicitud de apoyo',
};

/** Decide quién recibe el push de cada evento de ticket y lo envía. */
@Injectable()
export class TicketPushService {
  constructor(
    @InjectRepository(Ticket) private readonly tickets: Repository<Ticket>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly push: PushService,
  ) {}

  async notify(event: TicketPushEvent, ticketId: number) {
    const ticket = await this.tickets
      .createQueryBuilder('ticket')
      .leftJoin('ticket.sucursal', 'sucursal').addSelect(['sucursal.id', 'sucursal.nombre'])
      .leftJoin('ticket.cliente', 'cliente').addSelect(['cliente.id', 'cliente.razonSocial'])
      .leftJoin('ticket.createdBy', 'createdBy').addSelect(['createdBy.id'])
      .leftJoin('ticket.assigmentsTechnical', 'tech').addSelect(['tech.id', 'tech.name'])
      .where('ticket.id = :ticketId', { ticketId })
      .getOne();
    if (!ticket) return;

    const creatorId = ticket.createdBy?.id;
    const client = ticket.cliente?.razonSocial ?? ticket.nameCommercial ?? '';
    const summary = [client, (ticket.reasonReport ?? '').slice(0, 120)].filter(Boolean).join(' · ');
    const data = {
      type: event === 'TICKET_CREATED' ? 'NEW_TICKET' : event, // NEW_TICKET: lo que ya espera la app móvil
      event,
      ticketId: String(ticket.id),
      ticketNumber: ticket.ticketNumber ?? '',
    };

    switch (event) {
      case 'TICKET_CREATED': {
        const branchId = ticket.sucursal?.id;
        if (!branchId) return;
        const staff = await this.users
          .createQueryBuilder('user')
          .select('user.id')
          .innerJoin('user.sucursales', 'sucursal', 'sucursal.id = :branchId', { branchId })
          .innerJoin('user.roles', 'rol', 'rol.id IN (:...roles)', { roles: NEW_TICKET_ROLE_IDS })
          .where('user.isDelete = :isDelete', { isDelete: false })
          .getMany();
        const ids = staff.map((u) => u.id).filter((id) => id !== creatorId); // no avisar a quien lo creó
        await this.push.sendToUsers(ids, { title: `Nuevo ticket #${ticket.ticketNumber}`, body: summary || 'Hay un ticket nuevo en tu sucursal', data });
        return;
      }
      case 'TICKET_ASSIGNED': {
        const ids = (ticket.assigmentsTechnical ?? []).map((t) => t.id);
        await this.push.sendToUsers(ids, { title: `Te asignaron el ticket #${ticket.ticketNumber}`, body: summary, data });
        return;
      }
      default: {
        if (!creatorId) return;
        const status = STATUS_LABEL[ticket.status] ?? ticket.status;
        const title = event === 'TICKET_CLOSED' ? `Tu ticket #${ticket.ticketNumber} se cerró` : `Tu ticket #${ticket.ticketNumber}: ${status}`;
        await this.push.sendToUsers([creatorId], { title, body: summary, data });
      }
    }
  }
}
