import { PartialType } from '@nestjs/mapped-types';
import { CreateItequipmentDto } from './create-itequipment.dto';

export class UpdateItequipmentDto extends PartialType(CreateItequipmentDto) {}
