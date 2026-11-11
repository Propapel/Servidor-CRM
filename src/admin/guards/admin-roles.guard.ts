import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/user.entity';
import { ADMIN_PERMISSION_KEY, AdminPermissionName, hasSuperAdminRole } from '../admin-access';
import { ADMIN_ROLE_IDS } from '../admin.constants';

/**
 * Acceso a Administración (el guard global ya validó el token):
 * - El rol Administrador siempre pasa.
 * - Los demás necesitan el permiso de la pantalla (@RequireAdminPermission), por su rol o asignado directo.
 * - Si ese permiso todavía no está asignado a nadie, se permite al gerente regional (2) y al
 *   gerente de soporte (6) como antes, para que nadie se quede fuera al desplegar.
 */
@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (process.env.AUTH_GUARD === 'off') return true;
    const userId = Number(context.switchToHttp().getRequest().user?.sub);
    if (!userId) throw new ForbiddenException('Sesión no válida');

    const permission = this.reflector.getAllAndOverride<AdminPermissionName | undefined>(ADMIN_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const user = await this.users.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions', 'permissions'],
      select: { id: true, roles: { id: true, name: true, permissions: { id: true, name: true } }, permissions: { id: true, name: true } },
    });
    if (!user) throw new ForbiddenException('Sesión no válida');
    if (hasSuperAdminRole(user.roles)) return true;

    if (permission) {
      const granted =
        (user.permissions ?? []).some((p) => p.name === permission) ||
        (user.roles ?? []).some((r) => (r.permissions ?? []).some((p) => p.name === permission));
      if (granted) return true;
      if (!(await this.isAssignedToAnyone(permission)) && (user.roles ?? []).some((r) => ADMIN_ROLE_IDS.includes(String(r.id)))) {
        return true;
      }
      throw new ForbiddenException('No tienes permiso para esta sección de Administración');
    }

    if ((user.roles ?? []).some((r) => ADMIN_ROLE_IDS.includes(String(r.id)))) return true;
    throw new ForbiddenException('Solo un administrador puede hacer este cambio');
  }

  private async isAssignedToAnyone(permission: string) {
    const [byRole, direct] = await Promise.all([
      this.users.createQueryBuilder('u').innerJoin('u.roles', 'r').innerJoin('r.permissions', 'p', 'p.name = :permission', { permission }).getCount(),
      this.users.createQueryBuilder('u').innerJoin('u.permissions', 'p', 'p.name = :permission', { permission }).getCount(),
    ]);
    return byRole + direct > 0;
  }
}
