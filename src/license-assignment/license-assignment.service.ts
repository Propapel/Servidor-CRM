import { Injectable } from '@nestjs/common';
import { CreateLicenseAssignmentDto } from './dto/create-license-assignment.dto';
import { UpdateLicenseAssignmentDto } from './dto/update-license-assignment.dto';

@Injectable()
export class LicenseAssignmentService {
  create(createLicenseAssignmentDto: CreateLicenseAssignmentDto) {
    return 'This action adds a new licenseAssignment';
  }

  findAll() {
    return `This action returns all licenseAssignment`;
  }

  findOne(id: number) {
    return `This action returns a #${id} licenseAssignment`;
  }

  update(id: number, updateLicenseAssignmentDto: UpdateLicenseAssignmentDto) {
    return `This action updates a #${id} licenseAssignment`;
  }

  remove(id: number) {
    return `This action removes a #${id} licenseAssignment`;
  }
}
