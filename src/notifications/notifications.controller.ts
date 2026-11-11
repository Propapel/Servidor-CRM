import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, ParseIntPipe, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { CopyConfigDto, CreateRecipientDto, TestSmtpDto, UpdateRecipientDto, UpsertSmtpConfigDto } from './dto/notification.dto';
import { ADMIN_PERMISSIONS, RequireAdminPermission } from '../admin/admin-access';
import { NotificationsAdminGuard } from './guards/notifications-admin.guard';
import { NotificationsService } from './notifications.service';

/** Administración de notificaciones por correo (solo gerente regional / gerente de soporte). */
@UseGuards(NotificationsAdminGuard)
@RequireAdminPermission(ADMIN_PERMISSIONS.NOTIFICATIONS)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  private userId(req: Request): number | undefined {
    return Number((req as any).user?.sub) || undefined;
  }

  @Get('events')
  events() {
    return this.service.listEvents();
  }

  @Get('branches')
  branches() {
    return this.service.branchesOverview();
  }

  @Get('branches/:branchId')
  settings(@Param('branchId', ParseIntPipe) branchId: number) {
    return this.service.getBranchSettings(branchId);
  }

  @Put('branches/:branchId/smtp')
  upsertSmtp(@Param('branchId', ParseIntPipe) branchId: number, @Body() dto: UpsertSmtpConfigDto, @Req() req: Request) {
    return this.service.upsertSmtp(branchId, dto, this.userId(req));
  }

  @Delete('branches/:branchId/smtp')
  deleteSmtp(@Param('branchId', ParseIntPipe) branchId: number) {
    return this.service.deleteSmtp(branchId);
  }

  /**
   * 200 si el correo salió; 422 (no 502, que los proxies reemplazan) con { ok:false, step, message, detail }
   * si falló. Las versiones anteriores de la app muestran el mensaje igual.
   */
  @Post('branches/:branchId/smtp/test')
  async testSmtp(@Param('branchId', ParseIntPipe) branchId: number, @Body() dto: TestSmtpDto) {
    const result = await this.service.testSmtp(branchId, dto.to.trim());
    if (!result.ok) throw new HttpException(result, HttpStatus.UNPROCESSABLE_ENTITY);
    return result;
  }

  @Post('branches/:branchId/recipients')
  addRecipient(@Param('branchId', ParseIntPipe) branchId: number, @Body() dto: CreateRecipientDto) {
    return this.service.addRecipient(branchId, dto);
  }

  @Patch('recipients/:id')
  updateRecipient(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRecipientDto) {
    return this.service.updateRecipient(id, dto);
  }

  @Delete('recipients/:id')
  removeRecipient(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeRecipient(id);
  }

  @Post('branches/:branchId/copy')
  copy(@Param('branchId', ParseIntPipe) branchId: number, @Body() dto: CopyConfigDto, @Req() req: Request) {
    return this.service.copyConfig(branchId, dto, this.userId(req));
  }

  /** Historial paginado. ?branchId=&status=SENT|FAILED|SKIPPED&event=&page=&limit= */
  @Get('logs')
  logs(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('branchId') branchId: string,
    @Query('status') status: string,
    @Query('event') event: string,
    @Req() req: Request,
  ) {
    return this.service.findLogs(
      { page: Number(page) || 1, limit: Number(limit) || 25, branchId: Number(branchId) || undefined, status, event },
      req,
    );
  }
}
