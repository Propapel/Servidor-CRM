import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from '../clients/entities/client.entity';
import { NotificationRecipient } from '../notifications/entities/notification-recipient.entity';
import { NotificationSmtpConfig } from '../notifications/entities/notification-smtp-config.entity';
import { Permission } from '../permission/entities/permission.entity';
import { Rol } from '../roles/rol.entity';
import { Sucursales } from '../sucursales/entities/sucursale.entity';
import { Ticket } from '../ticket/entities/ticket.entity';
import { User } from '../users/user.entity';
import { AdminBranchesController, AdminPermissionsController, AdminRolesController } from './admin.controller';
import { BranchesAdminService } from './branches-admin.service';
import { AdminRolesGuard } from './guards/admin-roles.guard';
import { PermissionsAdminService } from './permissions-admin.service';
import { RolesAdminService } from './roles-admin.service';

/** Administración: roles, permisos y sucursales (solo administradores). */
@Module({
  imports: [
    TypeOrmModule.forFeature([Rol, Permission, User, Sucursales, Ticket, Client, NotificationRecipient, NotificationSmtpConfig]),
  ],
  controllers: [AdminRolesController, AdminPermissionsController, AdminBranchesController],
  providers: [RolesAdminService, PermissionsAdminService, BranchesAdminService, AdminRolesGuard],
})
export class AdminModule {}
