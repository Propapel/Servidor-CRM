import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Purchase } from '../purchase/entity/purchase.entity';
import { Customer } from '../customers/entity/customer.entity';
import { Project } from './entities/project.entity';
import { Opportunity } from '../oportunity/entity/oportunity.entity';
import { Interaction } from '../interation/entity/interation.entity';
import { Reminder } from '../remider/entity/remider.entity';
import { User } from '../users/user.entity';
import { PurchaseService } from '../purchase/purchase.service';
import { PurchaseController } from '../purchase/purchase.controller';
import { CustomersController } from '../customers/customers.controller';
import { CustomersService } from '../customers/customers.service';
import { OportunityService } from '../oportunity/oportunity.service';
import { OportunityController } from '../oportunity/oportunity.controller';
import { InterationService } from '../interation/interation.service';
import { RemiderService } from '../remider/remider.service';
import { UsersService } from '../users/users.service';
import { InterationController } from '../interation/interation.controller';
import { RemiderController } from '../remider/remider.controller';
import { UsersController } from '../users/users.controller';
import { ConfigModule } from '@nestjs/config';
import { PurchaseModule } from '../purchase/purchase.module';
import { ProjectCancellation } from './entities/projectCancellation.entity';
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
      Project,
      Purchase,
      Customer,
      Opportunity,
      Interaction,
      Reminder,
      CalendarEvent,
       Conversation,
      User,
      ProjectCancellation,
      LeadHistory
    ]),
    ConfigModule,
    PurchaseModule, // Importar el PurchaseModule aquí
  ],
  controllers: [
    ProjectsController,
    CustomersController,
    OportunityController,
    InterationController,
    RemiderController,
    UsersController,
  ],
  providers: [
    ProjectsService,
    CustomersService,
    OportunityService,
    InterationService,
    RemiderService,
    UsersService,
    MailService
  ],
})
export class ProjectsModule {}
