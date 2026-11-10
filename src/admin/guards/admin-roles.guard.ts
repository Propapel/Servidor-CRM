import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/user.entity';
import { ADMIN_ROLE_IDS } from '../admin.constants';

/** Solo administradores (gerente regional / gerente de soporte). El guard global ya validó el token. */
@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (process.env.AUTH_GUARD === 'off') return true;
    const userId = Number(context.switchToHttp().getRequest().user?.sub);
    if (!userId) throw new ForbiddenException('Sesión no válida');
    const isAdmin = await this.users
      .createQueryBuilder('user')
      .innerJoin('user.roles', 'rol')
      .where('user.id = :userId', { userId })
      .andWhere('rol.id IN (:...roles)', { roles: ADMIN_ROLE_IDS })
      .getCount();
    if (!isAdmin) throw new ForbiddenException('Solo un administrador puede hacer este cambio');
    return true;
  }
}
