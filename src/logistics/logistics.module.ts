import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { User } from '../users/user.entity';
import { LogisticsDecommission } from './entities/logistics-decommission.entity';
import { LogisticsPrinter } from './entities/logistics-printer.entity';
import { LogisticsShipment } from './entities/logistics-shipment.entity';
import { LogisticsController } from './logistics.controller';
import { LogisticsService } from './logistics.service';

@Module({
  imports: [TypeOrmModule.forFeature([LogisticsPrinter, LogisticsShipment, LogisticsDecommission, User])],
  controllers: [LogisticsController],
  providers: [LogisticsService, AdminRolesGuard],
})
export class LogisticsModule {}
