import { Module } from '@nestjs/common';
import { EquipmentRequestService } from './equipment-request.service';
import { EquipmentRequestController } from './equipment-request.controller';

@Module({
  controllers: [EquipmentRequestController],
  providers: [EquipmentRequestService],
})
export class EquipmentRequestModule {}
