import 'reflect-metadata';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { BranchesAdminService } from './branches-admin.service';
import { PermissionsAdminService } from './permissions-admin.service';
import { RolesAdminService } from './roles-admin.service';

const countQb = (count: number) => {
  const qb: any = { innerJoin: () => qb, where: () => qb, getCount: async () => count };
  return qb;
};

describe('Roles', () => {
  it('no permite eliminar roles del sistema', async () => {
    const svc = new RolesAdminService({} as any, {} as any, {} as any);
    await expect(svc.remove('2')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('no permite eliminar un rol que tiene usuarios', async () => {
    const svc = new RolesAdminService({ findOne: async () => ({ id: '9' }) } as any, {} as any, { createQueryBuilder: () => countQb(3) } as any);
    await expect(svc.remove('9')).rejects.toThrow('3 usuario(s)');
  });

  it('elimina un rol propio sin usuarios', async () => {
    const roles: any = { findOne: async () => ({ id: '9' }), save: jest.fn(), delete: jest.fn() };
    const svc = new RolesAdminService(roles, {} as any, { createQueryBuilder: () => countQb(0) } as any);
    await expect(svc.remove('9')).resolves.toEqual({ id: '9', deleted: true });
    expect(roles.delete).toHaveBeenCalledWith({ id: '9' });
  });

  it('un administrador no puede quitarse a sí mismo el rol de administrador', async () => {
    const svc = new RolesAdminService(
      { findOne: async () => ({ id: '1', name: 'Ejecutivo' }) } as any, {} as any,
      { findOne: async () => ({ id: 5, roles: [{ id: '2' }] }) } as any,
    );
    await expect(svc.assignUser('1', 5, 5)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('asignar reemplaza el rol del usuario (un rol por usuario)', async () => {
    const users: any = { findOne: async () => ({ id: 7, roles: [{ id: '5' }] }), save: jest.fn() };
    const svc = new RolesAdminService({ findOne: async () => ({ id: '6', name: 'Gerente soporte' }) } as any, {} as any, users);
    await svc.assignUser('6', 7, 5);
    expect(users.save.mock.calls[0][0].roles).toEqual([{ id: '6', name: 'Gerente soporte' }]);
  });
});

describe('Permisos', () => {
  it('no permite renombrar ni eliminar permisos que usa la app', async () => {
    const repo: any = { findOneBy: async () => ({ id: 1, name: 'leads', description: 'x' }) };
    const svc = new PermissionsAdminService(repo);
    await expect(svc.update(1, { name: 'otro' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.remove(1)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('sí permite cambiar la descripción de un permiso del sistema', async () => {
    const repo: any = { findOneBy: async () => ({ id: 1, name: 'leads', description: 'x' }), save: async (p: any) => p };
    const svc = new PermissionsAdminService(repo);
    await expect(svc.update(1, { description: 'Ver leads' })).resolves.toMatchObject({ description: 'Ver leads', system: true });
  });

  it('nombre repetido -> 409', async () => {
    const svc = new PermissionsAdminService({ findOneBy: async () => ({ id: 2 }) } as any);
    await expect(svc.create({ name: 'reportes', description: 'd' })).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('Sucursales', () => {
  const svc = (list: any[], user?: any) => {
    const s = new BranchesAdminService({} as any, { findOne: async () => user, save: jest.fn() } as any, {} as any, {} as any);
    jest.spyOn(s, 'list').mockResolvedValue(list);
    return s;
  };

  it('no elimina una sucursal con usuarios, tickets o clientes y dice por qué', async () => {
    const s = svc([{ id: 1, usersCount: 2, ticketsCount: 10, clientsCount: 0 }]);
    await expect(s.remove(1)).rejects.toThrow('2 usuario(s), 10 ticket(s)');
  });

  it('no deja a un usuario sin ninguna sucursal', async () => {
    const s = svc([], { id: 3, sucursales: [{ id: 1 }] });
    await expect(s.removeUser(1, 3)).rejects.toBeInstanceOf(BadRequestException);
  });
});
