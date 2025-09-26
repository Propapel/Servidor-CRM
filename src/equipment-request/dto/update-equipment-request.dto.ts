import { PartialType } from '@nestjs/mapped-types';
import { CreateEquipmentRequestDto } from './create-equipment-request.dto';

export class UpdateEquipmentRequestDto extends PartialType(CreateEquipmentRequestDto) {}
