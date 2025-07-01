import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ItequipmentsService } from './itequipments.service';
import { CreateItequipmentDto } from './dto/create-itequipment.dto';
import { UpdateItequipmentDto } from './dto/update-itequipment.dto';

@Controller('itequipments')
export class ItequipmentsController {
  constructor(private readonly itequipmentsService: ItequipmentsService) {}

  @Post()
  create(@Body() createItequipmentDto: CreateItequipmentDto) {
    return this.itequipmentsService.create(createItequipmentDto);
  }

  @Get()
  findAll() {
    return this.itequipmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.itequipmentsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateItequipmentDto: UpdateItequipmentDto) {
    return this.itequipmentsService.update(+id, updateItequipmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.itequipmentsService.remove(+id);
  }
}
