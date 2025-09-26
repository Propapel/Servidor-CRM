import { Module } from '@nestjs/common';
import { FacturacionRentaService } from './facturacion-renta.service';
import { FacturacionRentaController } from './facturacion-renta.controller';

@Module({
  controllers: [FacturacionRentaController],
  providers: [FacturacionRentaService],
})
export class FacturacionRentaModule {}
