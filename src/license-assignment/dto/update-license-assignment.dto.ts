import { PartialType } from '@nestjs/mapped-types';
import { CreateLicenseAssignmentDto } from './create-license-assignment.dto';

export class UpdateLicenseAssignmentDto extends PartialType(CreateLicenseAssignmentDto) {}
