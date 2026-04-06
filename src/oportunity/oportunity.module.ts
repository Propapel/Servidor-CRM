import { Module } from '@nestjs/common';
import { OportunityService } from './oportunity.service';
import { OportunityController } from './oportunity.controller';
import { Customer } from '../customers/entity/customer.entity';
import { User } from '../users/user.entity';
import { Opportunity } from '../oportunity/entity/oportunity.entity';
import { Interaction } from '../interation/entity/interation.entity';
import { Purchase } from '../purchase/entity/purchase.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CustomersService } from '../customers/customers.service';
import { UsersService } from '../users/users.service';
import { PurchaseService } from '../purchase/purchase.service';
import { InterationService } from '../interation/interation.service';
import { PurchaseController } from '../purchase/purchase.controller';
import { InterationController } from '../interation/interation.controller';
import { UsersController } from '../users/users.controller';
import { CustomersController } from '../customers/customers.controller';
import { Reminder } from '../remider/entity/remider.entity';
import { RemiderService } from '../remider/remider.service';
import { RemiderController } from '../remider/remider.controller';
import { RolesModule } from '../roles/roles.module';
import { Sucursales } from '../sucursales/entities/sucursale.entity';
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
      CalendarEvent,
      Opportunity,
      Interaction,
      Purchase,
      Reminder,
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
    MailService
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
export class OportunityModule {}
