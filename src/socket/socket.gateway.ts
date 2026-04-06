import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { Logger } from '@nestjs/common';
import { Ticket } from '../ticket/entities/ticket.entity';

@WebSocketGateway({
  path: '/tickets',
})
export class SocketGateway implements OnGatewayConnection<WebSocket>, OnGatewayDisconnect<WebSocket> {
  @WebSocketServer() server: Server;

   private pingInterval: NodeJS.Timeout;
   
  private readonly logger = new Logger(SocketGateway.name);

  handleConnection(client: WebSocket) {
    this.logger.log('Cliente conectado al WebSocket de tickets');
  }

  handleDisconnect(client: WebSocket) {
    this.logger.log('Cliente desconectado del WebSocket de tickets');
  }

  private broadcast(data: object) {
    const message = JSON.stringify(data);
    this.server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  emitNewTicket(ticket: Ticket) {
    this.broadcast({
      type: 'NEW_TICKET',
      payload: JSON.stringify({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        createdAt: ticket.createdAt,
        status: ticket.status,
        priority: ticket.priority,
        reasonReport: ticket.reasonReport,
        location: ticket.location,
        nameCommercial: ticket.nameCommercial,
        isForeign: ticket.isForeign,
        resolved: ticket.resolved,
        resolvedAt: ticket.resolvedAt,
        typeOfReport: ticket.typeOfReport,
        createdBy: ticket.createdBy ? {
          id: ticket.createdBy.id,
          name: ticket.createdBy.name,
          profilePicture: ticket.createdBy.image,
        } : null,
        cliente: ticket.cliente ? {
          id: ticket.cliente.id,
          name: ticket.cliente.razonSocial,
        } : null,
        assigmentsTechnical: ticket.assigmentsTechnical?.map((t) => ({
          id: t.id,
          name: t.name,
          profilePicture: t.image,
        })) ?? [],
        comments: ticket.comments ?? [],
        updates: ticket.updates ?? [],
        typeOfReportEntity: ticket.typeOfReportEntity ?? null,
      }),
    });
  }

  emitTicketUpdated(ticket: Ticket) {
    this.broadcast({
      type: 'TICKET_UPDATED',
      payload: JSON.stringify({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        updatedAt: ticket.updatedAt,
        status: ticket.status,
        priority: ticket.priority,
        reasonReport: ticket.reasonReport,
        location: ticket.location,
        nameCommercial: ticket.nameCommercial,
        isForeign: ticket.isForeign,
        resolved: ticket.resolved,
        resolvedAt: ticket.resolvedAt,
        typeOfReport: ticket.typeOfReport,
        createdBy: ticket.createdBy ? {
          id: ticket.createdBy.id,
          name: ticket.createdBy.name,
          profilePicture: ticket.createdBy.image,
        } : null,
        cliente: ticket.cliente ? {
          id: ticket.cliente.id,
          name: ticket.cliente.razonSocial,
        } : null,
        assigmentsTechnical: ticket.assigmentsTechnical?.map((t) => ({
          id: t.id,
          name: t.name,
          profilePicture: t.image,
        })) ?? [],
        comments: ticket.comments ?? [],
        updates: ticket.updates ?? [],
        typeOfReportEntity: ticket.typeOfReportEntity ?? null,
      }),
    });
  }

  emitTicketStatusChanged(ticket: Ticket) {
    this.broadcast({
      type: 'TICKET_STATUS_CHANGED',
      payload: JSON.stringify({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        newStatus: ticket.status,
        updatedAt: ticket.updatedAt,
        assigmentsTechnical: ticket.assigmentsTechnical?.map((t) => ({
          id: t.id,
          name: t.name,
          profilePicture: t.image,
        })) ?? [],
      }),
    });
  }

  emitTicketDeleted(ticketId: number) {
    this.broadcast({
      type: 'TICKET_DELETED',
      payload: JSON.stringify({ id: ticketId }),
    });
  }
}