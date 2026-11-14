import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ADMIN_PERMISSIONS, RequireAdminPermission } from '../admin/admin-access';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import {
  CreateDecommissionDto, CreatePrinterDto, CreateShipmentDto, ReviewDecommissionDto, UpdatePrinterDto, UpdateShipmentDto, UploadFileDto,
} from './dto/logistics.dto';
import { ListQuery, LogisticsService } from './logistics.service';

const userId = (req: Request) => Number((req as any).user?.sub) || undefined;
const listQuery = (q: Record<string, string>): ListQuery => ({
  branchId: Number(q.branchId) || undefined, status: q.status, type: q.type, search: q.search,
  page: Number(q.page) || 1, limit: Number(q.limit) || 25,
});

/**
 * Logística: envíos con guía, inventario de impresoras y bajas de equipos.
 * - logistica: ver y capturar todo el módulo.
 * - logistica-autorizar-bajas: autorizar o rechazar bajas.
 * - Solicitar una baja, ver las de un ticket y subir la responsiva: cualquier usuario con sesión (técnicos).
 */
@Controller('logistics')
export class LogisticsController {
  constructor(private readonly service: LogisticsService) {}

  @UseGuards(AdminRolesGuard) @RequireAdminPermission(ADMIN_PERMISSIONS.LOGISTICS)
  @Get('summary')
  summary(@Query('branchId') branchId?: string) { return this.service.summary(Number(branchId) || undefined); }

  // ---- inventario
  @UseGuards(AdminRolesGuard) @RequireAdminPermission(ADMIN_PERMISSIONS.LOGISTICS)
  @Get('printers')
  printers(@Query() q: Record<string, string>, @Req() req: Request) { return this.service.listPrinters(listQuery(q), req); }

  @UseGuards(AdminRolesGuard) @RequireAdminPermission(ADMIN_PERMISSIONS.LOGISTICS)
  @Post('printers')
  createPrinter(@Body() dto: CreatePrinterDto, @Req() req: Request) { return this.service.createPrinter(dto, userId(req)); }

  @UseGuards(AdminRolesGuard) @RequireAdminPermission(ADMIN_PERMISSIONS.LOGISTICS)
  @Patch('printers/:id')
  updatePrinter(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePrinterDto) { return this.service.updatePrinter(id, dto); }

  // ---- envíos
  @UseGuards(AdminRolesGuard) @RequireAdminPermission(ADMIN_PERMISSIONS.LOGISTICS)
  @Get('shipments')
  shipments(@Query() q: Record<string, string>, @Req() req: Request) { return this.service.listShipments(listQuery(q), req); }

  @UseGuards(AdminRolesGuard) @RequireAdminPermission(ADMIN_PERMISSIONS.LOGISTICS)
  @Post('shipments')
  createShipment(@Body() dto: CreateShipmentDto, @Req() req: Request) { return this.service.createShipment(dto, userId(req)); }

  @UseGuards(AdminRolesGuard) @RequireAdminPermission(ADMIN_PERMISSIONS.LOGISTICS)
  @Patch('shipments/:id')
  updateShipment(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateShipmentDto) { return this.service.updateShipment(id, dto); }

  @UseGuards(AdminRolesGuard) @RequireAdminPermission(ADMIN_PERMISSIONS.LOGISTICS)
  @Post('shipments/:id/guide')
  uploadGuide(@Param('id', ParseIntPipe) id: number, @Body() dto: UploadFileDto) { return this.service.uploadGuide(id, dto); }

  // ---- bajas
  @UseGuards(AdminRolesGuard) @RequireAdminPermission(ADMIN_PERMISSIONS.LOGISTICS)
  @Get('decommissions')
  decommissions(@Query() q: Record<string, string>, @Req() req: Request) { return this.service.listDecommissions(listQuery(q), req); }

  /** Bajas pedidas desde un ticket (para mostrarlas en el detalle del ticket). */
  @Get('decommissions/by-ticket/:ticketId')
  byTicket(@Param('ticketId', ParseIntPipe) ticketId: number) { return this.service.byTicket(ticketId); }

  /** El técnico la pide desde el ticket; queda pendiente de autorizar. */
  @Post('decommissions')
  requestDecommission(@Body() dto: CreateDecommissionDto, @Req() req: Request) { return this.service.requestDecommission(dto, userId(req)); }

  @UseGuards(AdminRolesGuard) @RequireAdminPermission(ADMIN_PERMISSIONS.LOGISTICS_AUTHORIZE)
  @Post('decommissions/:id/authorize')
  authorize(@Param('id', ParseIntPipe) id: number, @Body() dto: ReviewDecommissionDto, @Req() req: Request) {
    return this.service.authorize(id, userId(req), dto?.notes);
  }

  @UseGuards(AdminRolesGuard) @RequireAdminPermission(ADMIN_PERMISSIONS.LOGISTICS_AUTHORIZE)
  @Post('decommissions/:id/reject')
  reject(@Param('id', ParseIntPipe) id: number, @Body() dto: ReviewDecommissionDto, @Req() req: Request) {
    return this.service.reject(id, userId(req), dto?.notes);
  }

  /** Responsiva firmada y escaneada. */
  @Post('decommissions/:id/responsiva')
  uploadResponsiva(@Param('id', ParseIntPipe) id: number, @Body() dto: UploadFileDto) { return this.service.uploadResponsiva(id, dto); }
}
