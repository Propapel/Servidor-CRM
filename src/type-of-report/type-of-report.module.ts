import { Module } from '@nestjs/common';
import { TypeOfReportService } from './type-of-report.service';
import { TypeOfReportController } from './type-of-report.controller';

@Module({
  controllers: [TypeOfReportController],
  providers: [TypeOfReportService],
})
export class TypeOfReportModule {}
