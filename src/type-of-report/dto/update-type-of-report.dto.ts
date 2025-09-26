import { PartialType } from '@nestjs/mapped-types';
import { CreateTypeOfReportDto } from './create-type-of-report.dto';

export class UpdateTypeOfReportDto extends PartialType(CreateTypeOfReportDto) {}
