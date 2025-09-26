import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TypeOfReportService } from './type-of-report.service';
import { CreateTypeOfReportDto } from './dto/create-type-of-report.dto';
import { UpdateTypeOfReportDto } from './dto/update-type-of-report.dto';

@Controller('type-of-report')
export class TypeOfReportController {
  constructor(private readonly typeOfReportService: TypeOfReportService) {}

  @Post()
  create(@Body() createTypeOfReportDto: CreateTypeOfReportDto) {
    return this.typeOfReportService.create(createTypeOfReportDto);
  }

  @Get()
  findAll() {
    return this.typeOfReportService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.typeOfReportService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTypeOfReportDto: UpdateTypeOfReportDto) {
    return this.typeOfReportService.update(+id, updateTypeOfReportDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.typeOfReportService.remove(+id);
  }
}
