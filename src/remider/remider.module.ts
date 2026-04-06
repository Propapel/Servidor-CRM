import { Module } from '@nestjs/common';
import { RemiderService } from './remider.service';
import { RemiderController } from './remider.controller';
import { Customer } from '../customers/entity/customer.entity';
import { User } from '../users/user.entity';
import { Opportunity } from '../oportunity/entity/oportunity.entity';
import { Interaction } from '../interation/entity/interation.entity';
import { Purchase } from '../purchase/entity/purchase.entity';
import { Reminder } from './entity/remider.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CustomersService } from '../customers/customers.service';
import { UsersService } from '../users/users.service';
import { PurchaseService } from '../purchase/purchase.service';
import { OportunityService } from '../oportunity/oportunity.service';
import { InterationService } from '../interation/interation.service';
import { PurchaseController } from '../purchase/purchase.controller';
import { InterationController } from '../interation/interation.controller';
import { OportunityController } from '../oportunity/oportunity.controller';
import { UsersController } from '../users/users.controller';
import { CustomersController } from '../customers/customers.controller';
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
  imports:[
    RolesModule, 
    SucursalesModule,
    TypeOrmModule.forFeature([Customer, User, Opportunity, Interaction, Purchase, Reminder, Appointment, LeadHistory,  Conversation, CalendarEvent]),
    ConfigModule, // Importa ConfigModule aquí
  ],
  providers: [CustomersService, UsersService, PurchaseService, OportunityService, InterationService, RemiderService, AppointmentService, MailService],
  controllers: [CustomersController, UsersController, OportunityController, InterationController, PurchaseController, RemiderController, AppointmentController],
  exports: [RemiderService], 

})
export class RemiderModule {}
