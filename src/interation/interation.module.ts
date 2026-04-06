import { Module } from '@nestjs/common';
import { InterationService } from './interation.service';
import { InterationController } from './interation.controller';
import { CustomersService } from '../customers/customers.service';
import { UsersService } from '../users/users.service';
import { PurchaseService } from '../purchase/purchase.service';
import { OportunityService } from '../oportunity/oportunity.service';
import { PurchaseController } from '../purchase/purchase.controller';
import { OportunityController } from '../oportunity/oportunity.controller';
import { UsersController } from '../users/users.controller';
import { CustomersController } from '../customers/customers.controller';
import { Customer } from '../customers/entity/customer.entity';
import { User } from '../users/user.entity';
import { Opportunity } from '../oportunity/entity/oportunity.entity';
import { Interaction } from './entity/interation.entity';
import { Purchase } from '../purchase/entity/purchase.entity';
import { Reminder } from '../remider/entity/remider.entity';
import { RemiderService } from '../remider/remider.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { RemiderController } from '../remider/remider.controller';
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
      User,
       Conversation,
      Opportunity,
      Interaction,
      CalendarEvent,
      Purchase,
      Reminder,
      LeadHistory,
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
  ],
  controllers: [
    CustomersController,
    UsersController,
    OportunityController,
    InterationController,
    PurchaseController,
    RemiderController,
  ],
})
export class InterationModule {}
