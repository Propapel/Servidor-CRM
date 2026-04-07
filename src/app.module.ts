import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { CustomersModule } from './customers/customers.module';
import { OportunityModule } from './oportunity/oportunity.module';
import { InterationModule } from './interation/interation.module';
import { PurchaseModule } from './purchase/purchase.module';
import { RemiderModule } from './remider/remider.module';
import { RolesModule } from './roles/roles.module';
import { SucursalesModule } from './sucursales/sucursales.module';
import { ProjectsModule } from './projects/projects.module';
import { DocumentsPdfModule } from './documents-pdf/documents-pdf.module';
import { BannersModule } from './banners/banners.module';
import { AppointmentModule } from './appointment/appointment.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MailService } from './auth/service/MailService';
import { ActivityModule } from './activity/activity.module';
import { LeadHistoryModule } from './lead-history/lead-history.module';
import { LeadNotesModule } from './lead-notes/lead-notes.module';
import { SocketModule } from './socket/socket.module';
import { ConversationModule } from './conversation/conversation.module';
import { MessageModule } from './message/message.module';
import { UsersService } from './users/users.service';
import { CalendarEventModule } from './calendar-event/calendar-event.module';
import { ChatgptModule } from './chatgpt/chatgpt.module';
import { TicketModule } from './ticket/ticket.module';
import { CronService } from './cron/cron.service';
import { TaskModule } from './task/task.module';
import { TicketUpdatedModule } from './ticket-updated/ticket-updated.module';
import { TicketCommentModule } from './ticket-comment/ticket-comment.module';
import { ClientsModule } from './clients/clients.module';
import { DepartmentsModule } from './departments/departments.module';
import { ItequipmentsModule } from './itequipments/itequipments.module';
import { PermissionModule } from './permission/permission.module';
import { ProductModule } from './product/product.module';
import { LicenseModule } from './license/license.module';
import { LicenseAssignmentModule } from './license-assignment/license-assignment.module';
import { DealModule } from './deal/deal.module';
import { EquipmentRequestModule } from './equipment-request/equipment-request.module';
import { BitacoraModule } from './bitacora/bitacora.module';
import { RentaModule } from './renta/renta.module';
import { ContadorModule } from './contador/contador.module';
import { FacturacionRentaModule } from './facturacion-renta/facturacion-renta.module';
import { TicketStatusModule } from './ticket-status/ticket-status.module';
import { TypeOfReportModule } from './type-of-report/type-of-report.module';
import { EquipmentReplacementModule } from './equipment-replacement/equipment-replacement.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.HOST_DB,
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB,
      ssl: { rejectUnauthorized: true },
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true
    }),
    UsersModule,
    RolesModule,
    AuthModule,
    PassportModule,
    CustomersModule,
    OportunityModule,
    InterationModule,
    PurchaseModule,
    RemiderModule,
    SucursalesModule,
    ProjectsModule,
    DocumentsPdfModule,
    BannersModule,
    AppointmentModule,
    ActivityModule,
    LeadHistoryModule,
    LeadNotesModule,
    SocketModule,
    ConversationModule,
    MessageModule,
    CalendarEventModule,
    ChatgptModule,
    TicketModule,
    TaskModule,
    TicketUpdatedModule,
    TicketCommentModule,
    ClientsModule,
    DepartmentsModule,
    ItequipmentsModule,
    PermissionModule,
    ProductModule,
    LicenseModule,
    LicenseAssignmentModule,
    DealModule,
    EquipmentRequestModule,
    BitacoraModule,
    RentaModule,
    ContadorModule,
    FacturacionRentaModule,
    TicketStatusModule,
    TypeOfReportModule,
    EquipmentReplacementModule
  ],
  controllers: [AppController],
  providers: [AppService, CronService, MailService, UsersService],
})
export class AppModule {}
