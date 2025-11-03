import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EquipmentReplacementService } from './equipment-replacement.service';
import { CreateEquipmentReplacementDto } from './dto/create-equipment-replacement.dto';
import { UpdateEquipmentReplacementDto } from './dto/update-equipment-replacement.dto';

@Controller('equipment-replacement')
export class EquipmentReplacementController {
  constructor(private readonly equipmentReplacementService: EquipmentReplacementService) {}

  @Post()
  create(@Body() createEquipmentReplacementDto: CreateEquipmentReplacementDto) {
    return this.equipmentReplacementService.create(createEquipmentReplacementDto);
  }

  @Get()
  findAll() {
    return this.equipmentReplacementService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.equipmentReplacementService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEquipmentReplacementDto: UpdateEquipmentReplacementDto) {
    return this.equipmentReplacementService.update(+id, updateEquipmentReplacementDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.equipmentReplacementService.remove(+id);
  }
}
