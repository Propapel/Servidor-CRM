import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ADMIN_PERMISSIONS, isSuperAdminRole } from './admin-access';
import { AdminRolesGuard } from './guards/admin-roles.guard';

const ctx = (userId: number) =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ user: { sub: String(userId) } }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  }) as any;

function guardFor(user: any, assignedCount = 0, permission: string | undefined = ADMIN_PERMISSIONS.BRANCHES) {
  const reflector = { getAllAndOverride: () => permission } as unknown as Reflector;
  const qb: any = { innerJoin: () => qb, getCount: async () => assignedCount };
  const users: any = { findOne: async () => user, createQueryBuilder: () => qb };
  return new AdminRolesGuard(reflector, users);
}

const role = (id: string, name: string, permissions: string[] = []) => ({ id, name, permissions: permissions.map((n, i) => ({ id: i, name: n })) });

describe('rol Administrador', () => {
  it('se reconoce por nombre sin importar mayúsculas ni acentos', () => {
    expect(isSuperAdminRole({ id: '9', name: 'Administrador' })).toBe(true);
    expect(isSuperAdminRole({ id: '9', name: ' ADMINISTRADOR ' })).toBe(true);
    expect(isSuperAdminRole({ id: '2', name: 'Gerente regional' })).toBe(false);
  });

  it('se puede fijar por id con SUPER_ADMIN_ROLE_IDS', () => {
    process.env.SUPER_ADMIN_ROLE_IDS = '8';
    expect(isSuperAdminRole({ id: '8', name: 'Jefe' })).toBe(true);
    delete process.env.SUPER_ADMIN_ROLE_IDS;
  });
});

describe('AdminRolesGuard por permisos', () => {
  it('el Administrador siempre entra', async () => {
    await expect(guardFor({ id: 1, roles: [role('9', 'Administrador')], permissions: [] }, 5).canActivate(ctx(1))).resolves.toBe(true);
  });

  it('entra quien tiene el permiso de la pantalla por su rol', async () => {
    const user = { id: 1, roles: [role('6', 'Supervisor', [ADMIN_PERMISSIONS.BRANCHES])], permissions: [] };
    await expect(guardFor(user, 3).canActivate(ctx(1))).resolves.toBe(true);
  });

  it('bloquea al gerente sin el permiso cuando el permiso ya se asignó a alguien', async () => {
    const user = { id: 1, roles: [role('2', 'Gerente regional', [ADMIN_PERMISSIONS.NOTIFICATIONS])], permissions: [] };
    await expect(guardFor(user, 3).canActivate(ctx(1))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('si el permiso no está asignado a nadie, deja pasar a los gerentes 2 y 6 como antes', async () => {
    const user = { id: 1, roles: [role('2', 'Gerente regional')], permissions: [] };
    await expect(guardFor(user, 0).canActivate(ctx(1))).resolves.toBe(true);
  });

  it('nunca deja pasar a un ejecutivo sin permiso', async () => {
    const user = { id: 1, roles: [role('1', 'Ejecutivo de ventas')], permissions: [] };
    await expect(guardFor(user, 0).canActivate(ctx(1))).rejects.toBeInstanceOf(ForbiddenException);
  });
});
