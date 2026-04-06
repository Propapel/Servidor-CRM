import { Module } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { PurchaseController } from './purchase.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Purchase } from './entity/purchase.entity';
import { Customer } from '../customers/entity/customer.entity';
import { CustomersService } from '../customers/customers.service';
import { CustomersController } from '../customers/customers.controller';
import { ConfigModule } from '@nestjs/config';
import { OportunityController } from '../oportunity/oportunity.controller';
import { OportunityService } from '../oportunity/oportunity.service';
import { Opportunity } from '../oportunity/entity/oportunity.entity';
import { InterationController } from '../interation/interation.controller';
import { Interaction } from '../interation/entity/interation.entity';
import { InterationService } from '../interation/interation.service';
import { RemiderController } from '../remider/remider.controller';
import { RemiderService } from '../remider/remider.service';
import { Reminder } from '../remider/entity/remider.entity';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { UsersController } from '../users/users.controller';
import { Project } from '../projects/entities/project.entity';
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
      Purchase,
      LeadHistory,
      Customer,
      Opportunity,
      Interaction,
      Reminder,
      User,
      CalendarEvent,
      Project,
       Conversation
    ]),
    ConfigModule,
  ],
  providers: [
    PurchaseService,
    CustomersService,
    OportunityService,
    InterationService,
    RemiderService,
    UsersService,
    PurchaseModule,
    MailService
  ],
  controllers: [
    PurchaseController,
    CustomersController,
    OportunityController,
    InterationController,
    RemiderController,
    UsersController,
  ],
})
export class PurchaseModule {}
