import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { Sucursales } from '../sucursales/entities/sucursale.entity';
import { User } from '../users/user.entity';
import { ServiceSheetSettings } from './entities/service-sheet-settings.entity';
import { ServiceSheetController } from './service-sheet.controller';
import { ServiceSheetService } from './service-sheet.service';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceSheetSettings, Sucursales, User])],
  controllers: [ServiceSheetController],
  providers: [ServiceSheetService, AdminRolesGuard],
})
export class ServiceSheetModule {}
