import { Injectable } from '@nestjs/common';
import { CreateTypeOfReportDto } from './dto/create-type-of-report.dto';
import { UpdateTypeOfReportDto } from './dto/update-type-of-report.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOfReportEntity } from './entities/type-of-report.entity';

@Injectable()
export class TypeOfReportService {

  constructor(
    @InjectRepository(TypeOfReportEntity)
    private typeOfReportRepository: Repository<TypeOfReportEntity>,
  ) {}

  create(createTypeOfReportDto: CreateTypeOfReportDto) {
    return 'This action adds a new typeOfReport';
  }

 async findAll() {
    return await this.typeOfReportRepository
      .createQueryBuilder('typeOfReport')
      .orderBy('typeOfReport.createdAt', 'DESC')
      .getMany();
  }

  async findAllByBranch(branchId: number) {
    return await this.typeOfReportRepository
      .createQueryBuilder('typeOfReport')
      .andWhere('sucursalId = :branchId', { branchId })
      .orderBy('typeOfReport.createdAt', 'DESC')
      .getMany();
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
