import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sucursales } from '../sucursales/entities/sucursale.entity';
import { Ticket } from '../ticket/entities/ticket.entity';
import { User } from '../users/user.entity';
import { NotificationLog } from './entities/notification-log.entity';
import { NotificationRecipient } from './entities/notification-recipient.entity';
import { NotificationSmtpConfig } from './entities/notification-smtp-config.entity';
import { NotificationsAdminGuard } from './guards/notifications-admin.guard';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { TicketNotificationsService } from './ticket-notifications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationSmtpConfig, NotificationRecipient, NotificationLog, Sucursales, Ticket, User]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, TicketNotificationsService, NotificationsAdminGuard],
  exports: [NotificationsService, TicketNotificationsService],
})
export class NotificationsModule {}
