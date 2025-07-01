import { Module } from '@nestjs/common';
import { ItequipmentsService } from './itequipments.service';
import { ItequipmentsController } from './itequipments.controller';

@Module({
  controllers: [ItequipmentsController],
  providers: [ItequipmentsService],
})
export class ItequipmentsModule {}
