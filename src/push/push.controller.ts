import { Body, Controller, Get, Post, Req } from '@nestjs/common';
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

  @Get('devices')
  mine(@Req() req: Request) {
    return this.push.devicesOf(this.userId(req));
  }
}
