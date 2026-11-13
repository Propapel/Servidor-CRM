import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from '../ticket/entities/ticket.entity';
import { User } from '../users/user.entity';
import { PushDevice } from './entities/push-device.entity';
import { PushController } from './push.controller';
import { PushService } from './push.service';
import { TicketPushService } from './ticket-push.service';
import { LeadPushService } from './lead-push.service';
import { UserNotification } from './entities/user-notification.entity';
import { Reminder } from '../remider/entity/remider.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PushDevice, User, Ticket, UserNotification, Reminder])],
  controllers: [PushController],
  providers: [PushService, TicketPushService, LeadPushService],
  exports: [PushService, TicketPushService, LeadPushService],
})
export class PushModule {}
