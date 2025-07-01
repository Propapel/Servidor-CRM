import { Module } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { User } from 'src/users/user.entity';
import { Ticket } from './entities/ticket.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketUpdate } from 'src/ticket-updated/entities/ticket-updated.entity';
import { Itequipment } from 'src/itequipments/entities/itequipment.entity';
import { Client } from 'src/clients/entities/client.entity';

@Module({
   imports : [
      TypeOrmModule.forFeature([User, Ticket, TicketUpdate, Itequipment, Client]),
    ],
  controllers: [TicketController],
  providers: [TicketService],
})
export class TicketModule {}
