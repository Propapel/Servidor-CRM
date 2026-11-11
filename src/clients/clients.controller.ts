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
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ADMIN_PERMISSIONS, RequireAdminPermission } from '../admin/admin-access';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { Request } from 'express';
import { PageQueryDto } from '../common/pagination/page-query.dto';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as XLSX from 'xlsx';
import { User } from '../users/user.entity';

/**
 * Consultar clientes queda abierto (se usan al crear tickets); crear, editar, eliminar e
 * importar requieren el permiso helpdesk-clientes-admin.
 */
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @UseGuards(AdminRolesGuard)
  @RequireAdminPermission(ADMIN_PERMISSIONS.HELPDESK_CLIENTS)
  @Post('upload-excel')
  @UseInterceptors(FileInterceptor('file'))
  async uploadClientsExcel(@UploadedFile() file: Express.Multer.File) {
     return this.clientsService.uploadClientsExcel(file);
  }

  @UseGuards(AdminRolesGuard)
  @RequireAdminPermission(ADMIN_PERMISSIONS.HELPDESK_CLIENTS)
  @Post()
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Get()
  findAll() {
    return this.clientsService.findAll();
  }

  /** Clientes paginados. ?branchId=1&page=1&limit=25&search= */
  @Get('page')
  findPage(@Query() query: PageQueryDto, @Query('branchId') branchId: string, @Req() request: Request) {
    return this.clientsService.findPage({ ...query, branchId: Number(branchId) || undefined }, request);
  }

  @Get('findBySucursal/:id')
  findBySucursal(@Param('id', ParseIntPipe) sucursalId: number) {
    return this.clientsService.findBySucursal(sucursalId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(+id);
  }

  @UseGuards(AdminRolesGuard)
  @RequireAdminPermission(ADMIN_PERMISSIONS.HELPDESK_CLIENTS)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientsService.update(+id, updateClientDto);
  }

  @UseGuards(AdminRolesGuard)
  @RequireAdminPermission(ADMIN_PERMISSIONS.HELPDESK_CLIENTS)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clientsService.remove(+id);
  }
}
