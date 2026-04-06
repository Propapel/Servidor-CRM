import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SucursalesService } from './sucursales.service';
import { CreateSucursaleDto } from './dto/create-sucursale.dto';
import { UpdateSucursaleDto } from './dto/update-sucursale.dto';
import { AccessTokenGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sucursales')
export class SucursalesController {
  constructor(private readonly sucursalesService: SucursalesService) { }

  @UseGuards(AccessTokenGuard)
  @Post("create")
  create(@Body() createSucursaleDto: CreateSucursaleDto) {
    return this.sucursalesService.create(createSucursaleDto);
  }

  @UseGuards(AccessTokenGuard)
  @Get('findAll')
  findAll() {
    return this.sucursalesService.findAll();
  }

  @UseGuards(AccessTokenGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sucursalesService.findOne(+id);
  }

  @UseGuards(AccessTokenGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSucursaleDto: UpdateSucursaleDto) {
    return this.sucursalesService.update(+id, updateSucursaleDto);
  }

  @UseGuards(AccessTokenGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sucursalesService.remove(+id);
  }
}
