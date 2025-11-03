import { PartialType } from '@nestjs/mapped-types';
import { CreateEquipmentReplacementDto } from './create-equipment-replacement.dto';

export class UpdateEquipmentReplacementDto extends PartialType(CreateEquipmentReplacementDto) {}
