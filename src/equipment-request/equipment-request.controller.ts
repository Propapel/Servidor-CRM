import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EquipmentRequestService } from './equipment-request.service';
import { CreateEquipmentRequestDto } from './dto/create-equipment-request.dto';
import { UpdateEquipmentRequestDto } from './dto/update-equipment-request.dto';

@Controller('equipment-request')
export class EquipmentRequestController {
  constructor(private readonly equipmentRequestService: EquipmentRequestService) {}

  @Post()
  create(@Body() createEquipmentRequestDto: CreateEquipmentRequestDto) {
    return this.equipmentRequestService.create(createEquipmentRequestDto);
  }

  @Get()
  findAll() {
    return this.equipmentRequestService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.equipmentRequestService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEquipmentRequestDto: UpdateEquipmentRequestDto) {
    return this.equipmentRequestService.update(+id, updateEquipmentRequestDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.equipmentRequestService.remove(+id);
  }
}
