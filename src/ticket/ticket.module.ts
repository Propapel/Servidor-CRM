import { Module } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { User } from 'src/users/user.entity';
import { Ticket } from './entities/ticket.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketUpdate } from 'src/ticket-updated/entities/ticket-updated.entity';
import { Itequipment } from 'src/itequipments/entities/itequipment.entity';
import { Client } from 'src/clients/entities/client.entity';
import { MailService } from 'src/auth/service/MailService';
import { TicketComment } from 'src/ticket-comment/entities/ticket-comment.entity';
import { Sucursales } from 'src/sucursales/entities/sucursale.entity';
import { TypeOfReportEntity } from 'src/type-of-report/entities/type-of-report.entity';
import { SocketGateway } from 'src/socket/socket.gateway';

@Module({
   imports : [
      TypeOrmModule.forFeature([User, Ticket, TicketUpdate, Itequipment, Client, TicketComment, Sucursales, TypeOfReportEntity]),
    ],
  controllers: [TicketController],
  providers: [TicketService, MailService, SocketGateway],
})
export class TicketModule {}
