import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RentaService } from './renta.service';
import { CreateRentaDto } from './dto/create-renta.dto';
import { UpdateRentaDto } from './dto/update-renta.dto';

@Controller('renta')
export class RentaController {
  constructor(private readonly rentaService: RentaService) {}

  @Post()
  create(@Body() createRentaDto: CreateRentaDto) {
    return this.rentaService.create(createRentaDto);
  }

  @Get()
  findAll() {
    return this.rentaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rentaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRentaDto: UpdateRentaDto) {
    return this.rentaService.update(+id, updateRentaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rentaService.remove(+id);
  }
}
