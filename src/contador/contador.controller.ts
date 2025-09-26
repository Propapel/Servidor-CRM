import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ContadorService } from './contador.service';
import { CreateContadorDto } from './dto/create-contador.dto';
import { UpdateContadorDto } from './dto/update-contador.dto';

@Controller('contador')
export class ContadorController {
  constructor(private readonly contadorService: ContadorService) {}

  @Post()
  create(@Body() createContadorDto: CreateContadorDto) {
    return this.contadorService.create(createContadorDto);
  }

  @Get()
  findAll() {
    return this.contadorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contadorService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateContadorDto: UpdateContadorDto) {
    return this.contadorService.update(+id, updateContadorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contadorService.remove(+id);
  }
}
