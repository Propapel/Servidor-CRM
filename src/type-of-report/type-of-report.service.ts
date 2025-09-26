import { Injectable } from '@nestjs/common';
import { CreateTypeOfReportDto } from './dto/create-type-of-report.dto';
import { UpdateTypeOfReportDto } from './dto/update-type-of-report.dto';

@Injectable()
export class TypeOfReportService {
  create(createTypeOfReportDto: CreateTypeOfReportDto) {
    return 'This action adds a new typeOfReport';
  }

  findAll() {
    return `This action returns all typeOfReport`;
  }

  findOne(id: number) {
    return `This action returns a #${id} typeOfReport`;
  }

  update(id: number, updateTypeOfReportDto: UpdateTypeOfReportDto) {
    return `This action updates a #${id} typeOfReport`;
  }

  remove(id: number) {
    return `This action removes a #${id} typeOfReport`;
  }
}
