import { Module } from '@nestjs/common';
import { LicenseAssignmentService } from './license-assignment.service';
import { LicenseAssignmentController } from './license-assignment.controller';

@Module({
  controllers: [LicenseAssignmentController],
  providers: [LicenseAssignmentService],
})
export class LicenseAssignmentModule {}
