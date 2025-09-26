import { Module } from '@nestjs/common';
import { RentaService } from './renta.service';
import { RentaController } from './renta.controller';

@Module({
  controllers: [RentaController],
  providers: [RentaService],
})
export class RentaModule {}
