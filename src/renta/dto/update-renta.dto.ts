import { PartialType } from '@nestjs/mapped-types';
import { CreateRentaDto } from './create-renta.dto';

export class UpdateRentaDto extends PartialType(CreateRentaDto) {}
