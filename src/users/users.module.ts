import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { RefreshTokenStrategy } from '../auth/strategies/refreshToken.strategy';
import { ConfigModule } from '@nestjs/config';
import { AccessTokenStrategy } from '../auth/strategies/jwt.strategy';
import { CustomersController } from '../customers/customers.controller';
import { CustomersService } from '../customers/customers.service';
import { Customer } from '../customers/entity/customer.entity';
import { OportunityService } from '../oportunity/oportunity.service';
import { PurchaseService } from '../purchase/purchase.service';
import { RemiderService } from '../remider/remider.service';
import { Purchase } from '../purchase/entity/purchase.entity';
import { Opportunity } from '../oportunity/entity/oportunity.entity';
import { Reminder } from '../remider/entity/remider.entity';
import { Interaction } from '../interation/entity/interation.entity';
import { RolesModule } from '../roles/roles.module';
import { SucursalesModule } from '../sucursales/sucursales.module';
import { LeadHistory } from '../lead-history/entities/lead-history.entity';
import { MailService } from '../auth/service/MailService';
import { Conversation } from '../conversation/entities/conversation.entity';
import { CalendarEvent } from '../calendar-event/entities/calendar-event.entity';

@Module({
  imports:[
    SucursalesModule,
    RolesModule,
    TypeOrmModule.forFeature([User, Customer, Purchase, Opportunity, Reminder, Interaction, LeadHistory,  Conversation, CalendarEvent]),
    ConfigModule, // Importa ConfigModule aquí,
  ],
  providers: [CustomersService, UsersService, AccessTokenStrategy, RefreshTokenStrategy, CustomersService, OportunityService, PurchaseService, RemiderService, MailService],
  controllers: [UsersController, CustomersController]
})
export class UsersModule {
    
}
