import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { RegisterDeviceDto, UnregisterDeviceDto } from './dto/push.dto';
import { PushService } from './push.service';

/** Los equipos (app de escritorio, Android) registran aquí su token de push. Usa el usuario del token JWT. */
@Controller('push')
export class PushController {
  constructor(private readonly push: PushService) {}

  private userId(req: Request) {
    return Number((req as any).user?.sub);
  }

  @Post('devices')
  register(@Body() dto: RegisterDeviceDto, @Req() req: Request) {
    return this.push.registerDevice(this.userId(req), dto);
  }

  @Post('devices/unregister')
  unregister(@Body() dto: UnregisterDeviceDto, @Req() req: Request) {
    return this.push.unregisterDevice(this.userId(req), dto.token);
  }

  /** Igual que devices/unregister; la app de escritorio lo llama con DELETE al cerrar sesión. */
  @Delete('devices')
  unregisterDelete(@Body() dto: UnregisterDeviceDto, @Req() req: Request) {
    return this.push.unregisterDevice(this.userId(req), dto.token);
  }

  @Get('devices')
  mine(@Req() req: Request) {
    return this.push.devicesOf(this.userId(req));
  }

  /** Prueba desde la app: manda un push a los equipos del propio usuario (no queda en la bandeja). */
  @Post('test')
  test(@Req() req: Request) {
    return this.push.sendToUsers([this.userId(req)], {
      title: 'Notificaciones activas',
      body: 'Así se verán los avisos de tickets, citas y mensajes.',
      data: { type: 'TEST' },
      category: 'system',
      inbox: false,
    });
  }

  // ---------------------------------------------------------------- bandeja de avisos

  /** ?page=1&limit=20&unread=true */
  @Get('inbox')
  inbox(@Req() req: Request, @Query('page') page?: string, @Query('limit') limit?: string, @Query('unread') unread?: string) {
    return this.push.inboxOf(this.userId(req), Number(page) || 1, Number(limit) || 20, unread === 'true');
  }

  @Get('inbox/unread-count')
  unreadCount(@Req() req: Request) {
    return this.push.unreadCount(this.userId(req));
  }

  @Post('inbox/read-all')
  readAll(@Req() req: Request) {
    return this.push.markAllRead(this.userId(req));
  }

  @Post('inbox/:id/read')
  read(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.push.markRead(this.userId(req), id);
  }
}
