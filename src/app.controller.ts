import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';

const STARTED_AT = new Date().toISOString();

@Public() // Raíz: la usa la app para comprobar que el servidor responde
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  /** Estado del servidor y versión desplegada (commit de Railway), para verificar despliegues. */
  @Get('health')
  health() {
    return {
      status: 'ok',
      commit: (process.env.RAILWAY_GIT_COMMIT_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA ?? 'local').slice(0, 7),
      startedAt: STARTED_AT,
      uptimeSeconds: Math.round(process.uptime()),
    };
  }

  @Get('citas')
  getCitas(): string{
    return this.appService.getDates();
  }
}
