import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FacturacionRentaService } from './facturacion-renta.service';
import { CreateFacturacionRentaDto } from './dto/create-facturacion-renta.dto';
import { UpdateFacturacionRentaDto } from './dto/update-facturacion-renta.dto';

@Controller('facturacion-renta')
export class FacturacionRentaController {
  constructor(private readonly facturacionRentaService: FacturacionRentaService) {}

  @Post()
  create(@Body() createFacturacionRentaDto: CreateFacturacionRentaDto) {
    return this.facturacionRentaService.create(createFacturacionRentaDto);
  }

  @Get()
  findAll() {
    return this.facturacionRentaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.facturacionRentaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFacturacionRentaDto: UpdateFacturacionRentaDto) {
    return this.facturacionRentaService.update(+id, updateFacturacionRentaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.facturacionRentaService.remove(+id);
  }
}
