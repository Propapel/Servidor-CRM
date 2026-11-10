import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { In, Repository } from 'typeorm';
import { likeTerm } from '../common/pagination/page-query.dto';
import { normalizePage, safeUserSelect, toPagedResponse } from '../common/pagination/paged-response';
import { Permission } from '../permission/entities/permission.entity';
import { Rol } from '../roles/rol.entity';
import { User } from '../users/user.entity';
import { ADMIN_ROLE_IDS, SYSTEM_ROLE_IDS } from './admin.constants';
import { CreateRoleDto, UpdateRoleDto } from './dto/admin.dto';

@Injectable()
export class RolesAdminService {
  constructor(
    @InjectRepository(Rol) private readonly roles: Repository<Rol>,
    @InjectRepository(Permission) private readonly permissions: Repository<Permission>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  /** Roles con sus permisos y cuántos usuarios tiene cada uno. */
  async list() {
    const roles = await this.roles
      .createQueryBuilder('rol')
      .leftJoinAndSelect('rol.permissions', 'permission')
      .loadRelationCountAndMap('rol.usersCount', 'rol.users')
      .orderBy('CAST(rol.id AS UNSIGNED)', 'ASC')
      .addOrderBy('permission.name', 'ASC')
      .getMany();
    return roles.map((r) => this.toView(r));
  }

  async create(dto: CreateRoleDto) {
    const name = dto.name.trim();
    await this.ensureUniqueName(name);
    // Los ids son números en texto (la app los convierte a número)
    const raw = await this.roles.createQueryBuilder('rol').select('MAX(CAST(rol.id AS UNSIGNED))', 'max').getRawOne<{ max: string | null }>();
    const id = String(Math.max(Number(raw?.max) || 0, SYSTEM_ROLE_IDS.length) + 1);
    const role = this.roles.create({
      id,
      name,
      route: dto.route?.trim() ?? '',
      image: dto.image?.trim() ?? '',
      permissions: await this.loadPermissions(dto.permissionIds ?? []),
    });
    await this.roles.save(role);
    return this.findView(id);
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.roles.findOne({ where: { id }, relations: ['permissions'] });
    if (!role) throw new NotFoundException('Rol no encontrado');
    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (name.toLowerCase() !== role.name.toLowerCase()) await this.ensureUniqueName(name, id);
      role.name = name;
    }
    if (dto.route !== undefined) role.route = dto.route.trim();
    if (dto.image !== undefined) role.image = dto.image.trim();
    if (dto.permissionIds !== undefined) role.permissions = await this.loadPermissions(dto.permissionIds);
    role.updated_at = new Date();
    await this.roles.save(role);
    return this.findView(id);
  }

  async remove(id: string) {
    if (SYSTEM_ROLE_IDS.includes(id)) {
      throw new BadRequestException('Este rol lo usa el sistema; puedes editarlo pero no eliminarlo');
    }
    const role = await this.roles.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Rol no encontrado');
    const usersCount = await this.users.createQueryBuilder('user').innerJoin('user.roles', 'rol', 'rol.id = :id', { id }).getCount();
    if (usersCount > 0) {
      throw new ConflictException(`El rol tiene ${usersCount} usuario(s). Asígnales otro rol antes de eliminarlo`);
    }
    role.permissions = [];
    await this.roles.save(role); // limpia roles_permissions
    await this.roles.delete({ id });
    return { id, deleted: true };
  }

  /** Usuarios con este rol (paginado). */
  async usersOf(id: string, query: { page?: number; limit?: number; search?: string }, request?: Request) {
    const { page, limit, offset } = normalizePage(query.page, query.limit);
    const term = likeTerm(query.search);
    const qb = this.users
      .createQueryBuilder('user')
      .select([...safeUserSelect('user'), 'user.isDelete'])
      .innerJoin('user.roles', 'rol', 'rol.id = :id', { id })
      .leftJoinAndSelect('user.sucursales', 'sucursal');
    if (term) {
      qb.andWhere('(user.name LIKE :term OR user.lastname LIKE :term OR user.email LIKE :term)', { term });
    }
    const [results, total] = await qb.orderBy('user.name', 'ASC').addOrderBy('user.id', 'ASC').skip(offset).take(limit).getManyAndCount();
    return toPagedResponse(results, total, page, limit, request);
  }

  /** Cambia el rol del usuario a este (la app trabaja con un rol por usuario). */
  async assignUser(id: string, userId: number, currentUserId?: number) {
    const role = await this.roles.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Rol no encontrado');
    const user = await this.users.findOne({ where: { id: userId }, relations: ['roles'] });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (currentUserId === userId && !ADMIN_ROLE_IDS.includes(id)) {
      throw new BadRequestException('No puedes quitarte a ti mismo el rol de administrador');
    }
    user.roles = [role];
    await this.users.save(user);
    return { userId, roleId: id, roleName: role.name };
  }

  // ------------------------------------------------------------------ internos

  private async findView(id: string) {
    const role = await this.roles
      .createQueryBuilder('rol')
      .leftJoinAndSelect('rol.permissions', 'permission')
      .loadRelationCountAndMap('rol.usersCount', 'rol.users')
      .where('rol.id = :id', { id })
      .getOne();
    if (!role) throw new NotFoundException('Rol no encontrado');
    return this.toView(role);
  }

  private toView(r: Rol & { usersCount?: number }) {
    return {
      id: r.id,
      name: r.name,
      route: r.route,
      image: r.image,
      system: SYSTEM_ROLE_IDS.includes(r.id),
      usersCount: r.usersCount ?? 0,
      permissions: (r.permissions ?? []).map((p) => ({ id: p.id, name: p.name, description: p.description })),
      updatedAt: r.updated_at,
    };
  }

  private async ensureUniqueName(name: string, exceptId?: string) {
    const existing = await this.roles.createQueryBuilder('rol').where('LOWER(rol.name) = LOWER(:name)', { name }).getOne();
    if (existing && existing.id !== exceptId) throw new ConflictException(`Ya existe un rol llamado "${name}"`);
  }

  private async loadPermissions(ids: number[]) {
    const unique = [...new Set(ids)];
    if (!unique.length) return [];
    const found = await this.permissions.findBy({ id: In(unique) });
    if (found.length !== unique.length) throw new BadRequestException('Algún permiso no existe');
    return found;
  }
}
