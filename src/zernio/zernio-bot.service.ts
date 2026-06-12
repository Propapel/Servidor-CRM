import { Injectable, Logger } from '@nestjs/common';
import { ZernioService } from './zernio.service';
import { TicketService } from '../ticket/ticket.service';
import { CreatePublicTicketDto } from '../ticket/dto/create-public-ticket.dto';

export enum BotStep {
  IDLE = 'IDLE',
  AWAITING_NAME = 'AWAITING_NAME',
  AWAITING_PHONE = 'AWAITING_PHONE',
  AWAITING_REASON = 'AWAITING_REASON',
  AWAITING_SUCURSAL = 'AWAITING_SUCURSAL'
}

interface BotSession {
  step: BotStep;
  accountId: string; // The account id that we need to use when sending messages back
  dto: Partial<CreatePublicTicketDto>;
}

@Injectable()
export class ZernioBotService {
  private readonly logger = new Logger(ZernioBotService.name);
  private sessions = new Map<string, BotSession>(); // Keyed by conversationId

  constructor(
    private readonly zernioService: ZernioService,
    private readonly ticketService: TicketService
  ) {}

  async handleIncomingMessage(conversationId: string, accountId: string, text: string) {
    if (!text) return; // Ignore non-text messages for now
    text = text.trim();

    let session = this.sessions.get(conversationId);

    // Initialization trigger
    if (!session || session.step === BotStep.IDLE) {
      if (text.toLowerCase() === 'ticket' || text.toLowerCase() === 'ayuda' || text.toLowerCase() === 'help') {
        session = { step: BotStep.AWAITING_NAME, accountId, dto: {} };
        this.sessions.set(conversationId, session);
        await this.sendMessage(conversationId, accountId, '¡Hola! Vamos a crear un ticket. ¿Cuál es tu nombre?');
      }
      return;
    }

    // Process based on current state
    switch (session.step) {
      case BotStep.AWAITING_NAME:
        session.dto.nameReported = text;
        session.step = BotStep.AWAITING_PHONE;
        await this.sendMessage(conversationId, accountId, 'Gracias. ¿Cuál es tu número de teléfono?');
        break;

      case BotStep.AWAITING_PHONE:
        session.dto.phoneReport = text;
        session.step = BotStep.AWAITING_REASON;
        await this.sendMessage(conversationId, accountId, 'Entendido. ¿Cuál es el motivo de tu reporte o el problema que presentas?');
        break;

      case BotStep.AWAITING_REASON:
        session.dto.reasonReport = text;
        session.step = BotStep.AWAITING_SUCURSAL;
        await this.sendMessage(conversationId, accountId, 'Perfecto. Finalmente, ¿A qué sucursal perteneces?\nEscribe el número de la sucursal:\n2 - Mérida\n3 - Monterrey\n4 - México');
        break;

      case BotStep.AWAITING_SUCURSAL:
        const sucursalId = parseInt(text);
        if ([2, 3, 4].includes(sucursalId)) {
          session.dto.sucursalId = sucursalId;
          await this.createTicket(conversationId, session);
        } else {
          await this.sendMessage(conversationId, accountId, 'Por favor, ingresa una sucursal válida:\n2 - Mérida\n3 - Monterrey\n4 - México');
        }
        break;
    }
  }

  private async sendMessage(conversationId: string, accountId: string, text: string) {
    try {
      await this.zernioService.sendMessage(conversationId, accountId, {
        message: text
      });
    } catch (error) {
      this.logger.error(`Error sending message to ${conversationId}:`, error);
    }
  }

  private async createTicket(conversationId: string, session: BotSession) {
    try {
      // Set some defaults
      session.dto.nameCommercial = session.dto.nameReported; // Set commercial name to the reported name if empty
      
      const ticket = await this.ticketService.createPublicTicketWithFiles([], session.dto as CreatePublicTicketDto);
      
      await this.sendMessage(conversationId, session.accountId, `¡Tu ticket ha sido creado exitosamente!\nNúmero de ticket: ${ticket.ticketNumber}\nID de seguimiento: ${ticket.statusToken}`);
      
      // Reset session
      this.sessions.delete(conversationId);
    } catch (error) {
      this.logger.error('Error creating ticket from bot:', error);
      await this.sendMessage(conversationId, session.accountId, 'Hubo un error al crear tu ticket. Por favor, intenta de nuevo más tarde o contacta a soporte.');
      this.sessions.delete(conversationId);
    }
  }
}
