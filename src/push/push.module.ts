import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from '../ticket/entities/ticket.entity';
import { User } from '../users/user.entity';
import { PushDevice } from './entities/push-device.entity';
import { PushController } from './push.controller';
import { PushService } from './push.service';
import { TicketPushService } from './ticket-push.service';

@Module({
  imports: [TypeOrmModule.forFeature([PushDevice, User, Ticket])],
  controllers: [PushController],
  providers: [PushService, TicketPushService],
  exports: [PushService, TicketPushService],
})
export class PushModule {}
