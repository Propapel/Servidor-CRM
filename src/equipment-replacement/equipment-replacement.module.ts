import { Module } from '@nestjs/common';
import { EquipmentReplacementService } from './equipment-replacement.service';
import { EquipmentReplacementController } from './equipment-replacement.controller';

@Module({
  controllers: [EquipmentReplacementController],
  providers: [EquipmentReplacementService],
})
export class EquipmentReplacementModule {}
