import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Customer } from './entity/customer.entity';
import { UsersController } from '../users/users.controller';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { Interaction } from '../interation/entity/interation.entity';
import { Purchase } from '../purchase/entity/purchase.entity';
import { Reminder } from '../remider/entity/remider.entity';
import { PurchaseService } from '../purchase/purchase.service';
import { OportunityService } from '../oportunity/oportunity.service';
import { InterationService } from '../interation/interation.service';
import { RemiderService } from '../remider/remider.service';
import { InterationController } from '../interation/interation.controller';
import { PurchaseController } from '../purchase/purchase.controller';
import { RemiderController } from '../remider/remider.controller';
import { Opportunity } from '../oportunity/entity/oportunity.entity';
import { OportunityController } from '../oportunity/oportunity.controller';
import { Project } from '../projects/entities/project.entity';
import { Appointment } from '../appointment/entities/appointment.entity';
import { AppointmentService } from '../appointment/appointment.service';
import { AppointmentController } from '../appointment/appointment.controller';
import { RolesModule } from '../roles/roles.module';
import { SucursalesModule } from '../sucursales/sucursales.module';
import { LeadHistory } from '../lead-history/entities/lead-history.entity';
import { MailService } from '../auth/service/MailService';
import { Conversation } from '../conversation/entities/conversation.entity';
import { CalendarEvent } from '../calendar-event/entities/calendar-event.entity';

@Module({
  imports: [
    RolesModule,
    SucursalesModule,
    TypeOrmModule.forFeature([
      Customer,
      Conversation,
      User,
      Opportunity,
      Interaction,
      Purchase,
      Reminder,
      Project,
      Appointment,
      CalendarEvent,
      LeadHistory
    ]),
    ConfigModule, // Importa ConfigModule aquí
  ],
  providers: [
    CustomersService,
    UsersService,
    PurchaseService,
    OportunityService,
    InterationService,
    RemiderService,
    MailService,
    AppointmentService,
  ],
  controllers: [
    CustomersController,
    UsersController,
    OportunityController,
    InterationController,
    PurchaseController,
    RemiderController,
    AppointmentController,
  ],
})
export class CustomersModule {}
