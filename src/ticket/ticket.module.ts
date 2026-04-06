import { Module } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { User } from '../users/user.entity';
import { Ticket } from './entities/ticket.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketUpdate } from '../ticket-updated/entities/ticket-updated.entity';
import { Itequipment } from '../itequipments/entities/itequipment.entity';
import { Client } from '../clients/entities/client.entity';
import { MailService } from '../auth/service/MailService';
import { TicketComment } from '../ticket-comment/entities/ticket-comment.entity';
import { Sucursales } from '../sucursales/entities/sucursale.entity';
import { TypeOfReportEntity } from '../type-of-report/entities/type-of-report.entity';
import { SocketGateway } from '../socket/socket.gateway';

@Module({
   imports : [
      TypeOrmModule.forFeature([User, Ticket, TicketUpdate, Itequipment, Client, TicketComment, Sucursales, TypeOfReportEntity]),
    ],
  controllers: [TicketController],
  providers: [TicketService, MailService, SocketGateway],
})
export class TicketModule {}
