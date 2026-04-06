import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  HttpException,
  ParseIntPipe,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as XLSX from 'xlsx';
import { User } from '../users/user.entity';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post('upload-excel')
  @UseInterceptors(FileInterceptor('file'))
  async uploadClientsExcel(@UploadedFile() file: Express.Multer.File) {
     return this.clientsService.uploadClientsExcel(file);
  }

  @Post()
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Get()
  findAll() {
    return this.clientsService.findAll();
  }

  @Get('findBySucursal/:id')
  findBySucursal(@Param('id', ParseIntPipe) sucursalId: number) {
    return this.clientsService.findBySucursal(sucursalId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientsService.update(+id, updateClientDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clientsService.remove(+id);
  }
}
