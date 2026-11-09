import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Exige un access token válido en TODAS las rutas HTTP, salvo las marcadas con @Public().
 * Con el token caducado responde 401, la app intenta renovarlo y, si no puede, cierra la sesión.
 *
 * Interruptor de emergencia: AUTH_GUARD=off en las variables de entorno lo desactiva sin
 * tocar código (por si algún cliente web todavía no manda el token).
 */
@Injectable()
export class GlobalJwtGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(GlobalJwtGuard.name);
  private readonly enabled = process.env.AUTH_GUARD !== 'off';

  constructor(private readonly reflector: Reflector) {
    super();
    if (!this.enabled) this.logger.warn('AUTH_GUARD=off: las rutas no exigen token');
  }

  canActivate(context: ExecutionContext) {
    if (!this.enabled || context.getType() !== 'http') return true;
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
