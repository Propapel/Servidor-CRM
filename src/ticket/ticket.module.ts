import { Module } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { User } from 'src/users/user.entity';
import { Ticket } from './entities/ticket.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketUpdate } from 'src/ticket-updated/entities/ticket-updated.entity';

@Module({
   imports : [
      TypeOrmModule.forFeature([User, Ticket, TicketUpdate]),
    ],
  controllers: [TicketController],
  providers: [TicketService],
})
export class TicketModule {}
