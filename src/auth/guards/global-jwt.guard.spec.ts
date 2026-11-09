import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Public } from '../decorators/public.decorator';
import { AccessTokenStrategy } from '../strategies/jwt.strategy';
import { GlobalJwtGuard } from './global-jwt.guard';

process.env.JWT_ACCESS_SECRET = 'test-secret';
new AccessTokenStrategy(); // registra la estrategia 'jwt' en passport

class Ctrl {
  @Public() open() {}
  closed() {}
}

function ctx(handler: () => void, authorization?: string): ExecutionContext {
  const req: any = { headers: authorization ? { authorization } : {} };
  return {
    getType: () => 'http',
    getHandler: () => handler,
    getClass: () => Ctrl,
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => ({}) }),
  } as any;
}

describe('GlobalJwtGuard', () => {
  const jwt = new JwtService({ secret: 'test-secret' });
  const guard = () => new GlobalJwtGuard(new Reflector());

  afterEach(() => delete process.env.AUTH_GUARD);

  it('deja pasar rutas @Public sin token', async () => {
    await expect(Promise.resolve(guard().canActivate(ctx(Ctrl.prototype.open)))).resolves.toBe(true);
  });

  it('rechaza rutas protegidas sin token', async () => {
    await expect(guard().canActivate(ctx(Ctrl.prototype.closed))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('acepta un token válido', async () => {
    const token = await jwt.signAsync({ sub: '1', username: 'a' }, { expiresIn: '5m' });
    await expect(guard().canActivate(ctx(Ctrl.prototype.closed, `Bearer ${token}`))).resolves.toBe(true);
  });

  it('rechaza un token caducado (la app lo renueva o cierra sesión)', async () => {
    const token = await jwt.signAsync({ sub: '1', username: 'a', exp: Math.floor(Date.now() / 1000) - 10 });
    await expect(guard().canActivate(ctx(Ctrl.prototype.closed, `Bearer ${token}`))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('AUTH_GUARD=off lo desactiva', async () => {
    process.env.AUTH_GUARD = 'off';
    await expect(Promise.resolve(guard().canActivate(ctx(Ctrl.prototype.closed)))).resolves.toBe(true);
  });
});
