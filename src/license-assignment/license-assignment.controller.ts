import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LicenseAssignmentService } from './license-assignment.service';
import { CreateLicenseAssignmentDto } from './dto/create-license-assignment.dto';
import { UpdateLicenseAssignmentDto } from './dto/update-license-assignment.dto';

@Controller('license-assignment')
export class LicenseAssignmentController {
  constructor(private readonly licenseAssignmentService: LicenseAssignmentService) {}

  @Post()
  create(@Body() createLicenseAssignmentDto: CreateLicenseAssignmentDto) {
    return this.licenseAssignmentService.create(createLicenseAssignmentDto);
  }

  @Get()
  findAll() {
    return this.licenseAssignmentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.licenseAssignmentService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLicenseAssignmentDto: UpdateLicenseAssignmentDto) {
    return this.licenseAssignmentService.update(+id, updateLicenseAssignmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.licenseAssignmentService.remove(+id);
  }
}
