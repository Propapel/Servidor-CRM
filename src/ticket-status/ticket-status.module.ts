import { Module } from '@nestjs/common';
import { TicketStatusService } from './ticket-status.service';
import { TicketStatusController } from './ticket-status.controller';

@Module({
  controllers: [TicketStatusController],
  providers: [TicketStatusService],
})
export class TicketStatusModule {}
