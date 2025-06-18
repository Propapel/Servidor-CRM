import { Module } from '@nestjs/common';
import { TicketUpdatedService } from './ticket-updated.service';
import { TicketUpdatedController } from './ticket-updated.controller';

@Module({
  controllers: [TicketUpdatedController],
  providers: [TicketUpdatedService],
})
export class TicketUpdatedModule {}
