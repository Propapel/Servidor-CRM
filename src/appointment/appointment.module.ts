import { Module } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../customers/entity/customer.entity';
import { Appointment } from './entities/appointment.entity';
import { ConfigModule } from '@nestjs/config';
import { CustomersService } from '../customers/customers.service';
import { CustomersController } from '../customers/customers.controller';
import { PurchaseService } from '../purchase/purchase.service';
import { OportunityService } from '../oportunity/oportunity.service';
import { InterationService } from '../interation/interation.service';
import { RemiderService } from '../remider/remider.service';
import { OportunityController } from '../oportunity/oportunity.controller';
import { InterationController } from '../interation/interation.controller';
import { PurchaseController } from '../purchase/purchase.controller';
import { RemiderController } from '../remider/remider.controller';
import { Reminder } from '../remider/entity/remider.entity';
import { Opportunity } from '../oportunity/entity/oportunity.entity';
import { Interaction } from '../interation/entity/interation.entity';
import { Purchase } from '../purchase/entity/purchase.entity';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { UsersController } from '../users/users.controller';
import { SucursalesModule } from '../sucursales/sucursales.module';
import { RolesModule } from '../roles/roles.module';
import { LeadHistory } from '../lead-history/entities/lead-history.entity';
import { MailService } from '../auth/service/MailService';
import { Conversation } from '../conversation/entities/conversation.entity';
import { CalendarEvent } from '../calendar-event/entities/calendar-event.entity';

@Module({
  imports: [
     RolesModule,
        SucursalesModule,
    TypeOrmModule.forFeature([
      Customer, Appointment, Reminder, Opportunity, Interaction, Purchase, User, LeadHistory,  Conversation, CalendarEvent
    ]),
    ConfigModule
  ],
  providers: [AppointmentService, CustomersService, PurchaseService, OportunityService, InterationService, RemiderService, UsersService, MailService],
  controllers: [AppointmentController, CustomersController, OportunityController, InterationController, PurchaseController, RemiderController ]
})
export class AppointmentModule {}
