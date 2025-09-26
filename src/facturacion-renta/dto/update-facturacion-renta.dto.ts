import { PartialType } from '@nestjs/mapped-types';
import { CreateFacturacionRentaDto } from './create-facturacion-renta.dto';

export class UpdateFacturacionRentaDto extends PartialType(CreateFacturacionRentaDto) {}
