import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/user.entity';

/** Gerente regional (2) y gerente de soporte técnico (6). */
export const NOTIFICATION_ADMIN_ROLE_IDS = ['2', '6'];

/** Solo los administradores configuran SMTP y destinatarios (el guard global ya validó el token). */
@Injectable()
export class NotificationsAdminGuard implements CanActivate {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (process.env.AUTH_GUARD === 'off') return true;
    const request = context.switchToHttp().getRequest();
    const userId = Number(request.user?.sub);
    if (!userId) throw new ForbiddenException('Sesión no válida');
    const count = await this.users
      .createQueryBuilder('user')
      .innerJoin('user.roles', 'rol')
      .where('user.id = :userId', { userId })
      .andWhere('rol.id IN (:...roles)', { roles: NOTIFICATION_ADMIN_ROLE_IDS })
      .getCount();
    if (count === 0) throw new ForbiddenException('Solo un administrador puede cambiar las notificaciones');
    return true;
  }
}
