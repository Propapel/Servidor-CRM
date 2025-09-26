import { PartialType } from '@nestjs/mapped-types';
import { CreateContadorDto } from './create-contador.dto';

export class UpdateContadorDto extends PartialType(CreateContadorDto) {}
