import { Body, Controller, Get, Param, ParseIntPipe, Put, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ADMIN_PERMISSIONS, RequireAdminPermission } from '../admin/admin-access';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { UpsertServiceSheetDto } from './dto/service-sheet.dto';
import { ServiceSheetService } from './service-sheet.service';

/** Formato de la hoja de servicio por sucursal. La app genera el PDF; aquí solo se guarda el formato. */
@Controller('service-sheet')
export class ServiceSheetController {
  constructor(private readonly service: ServiceSheetService) {}

  /** Cualquier usuario con sesión (los técnicos lo usan al exportar un ticket). 404 = usar el predeterminado. */
  @Get('branches/:branchId')
  get(@Param('branchId', ParseIntPipe) branchId: number) {
    return this.service.get(branchId);
  }

  @UseGuards(AdminRolesGuard)
  @RequireAdminPermission(ADMIN_PERMISSIONS.SERVICE_SHEET)
  @Put('branches/:branchId')
  upsert(@Param('branchId', ParseIntPipe) branchId: number, @Body() dto: UpsertServiceSheetDto, @Req() req: Request) {
    return this.service.upsert(branchId, dto, Number((req as any).user?.sub) || undefined);
  }
}
