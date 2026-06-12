import { Module } from '@nestjs/common';
import { ZernioService } from './zernio.service';
import { ZernioController } from './zernio.controller';
import { TicketModule } from '../ticket/ticket.module';
import { ZernioBotService } from './zernio-bot.service';

@Module({
  imports: [TicketModule],
  providers: [ZernioService, ZernioBotService],
  controllers: [ZernioController],
  exports: [ZernioService]
})
export class ZernioModule {}
