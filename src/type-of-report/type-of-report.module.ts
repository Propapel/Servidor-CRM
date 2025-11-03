import { Module } from '@nestjs/common';
import { TypeOfReportService } from './type-of-report.service';
import { TypeOfReportController } from './type-of-report.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOfReportEntity } from './entities/type-of-report.entity';

@Module({
   imports : [
      TypeOrmModule.forFeature([TypeOfReportEntity]),
    ],
  controllers: [TypeOfReportController],
  providers: [TypeOfReportService],
})
export class TypeOfReportModule {}
