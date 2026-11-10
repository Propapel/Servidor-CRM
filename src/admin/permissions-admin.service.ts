import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../permission/entities/permission.entity';
import { SYSTEM_PERMISSION_NAMES } from './admin.constants';
import { CreatePermissionDto, UpdatePermissionDto } from './dto/admin.dto';

@Injectable()
export class PermissionsAdminService {
  constructor(@InjectRepository(Permission) private readonly permissions: Repository<Permission>) {}

  /** Catálogo de permisos con cuántos roles y usuarios los tienen. */
  async list() {
    const rows = await this.permissions
      .createQueryBuilder('permission')
      .loadRelationCountAndMap('permission.rolesCount', 'permission.roles')
      .orderBy('permission.name', 'ASC')
      .getMany();
    const direct: { id: number; total: string }[] = await this.permissions.manager.query(
      'SELECT id_permission AS id, COUNT(*) AS total FROM user_has_permissions GROUP BY id_permission',
    );
    const usersById = new Map(direct.map((d) => [Number(d.id), Number(d.total)]));
    return rows.map((p) => this.toView(p as Permission & { rolesCount?: number }, usersById.get(p.id) ?? 0));
  }

  async create(dto: CreatePermissionDto) {
    const name = dto.name.trim();
    await this.ensureUniqueName(name);
    const saved = await this.permissions.save(this.permissions.create({ name, description: dto.description.trim() }));
    return this.toView(saved, 0);
  }

  async update(id: number, dto: UpdatePermissionDto) {
    const permission = await this.permissions.findOneBy({ id });
    if (!permission) throw new NotFoundException('Permiso no encontrado');
    if (dto.name !== undefined && dto.name.trim() !== permission.name) {
      if (SYSTEM_PERMISSION_NAMES.includes(permission.name)) {
        throw new BadRequestException('La app usa este permiso por su nombre; solo puedes cambiar su descripción');
      }
      await this.ensureUniqueName(dto.name.trim());
      permission.name = dto.name.trim();
    }
    if (dto.description !== undefined) permission.description = dto.description.trim();
    const saved = await this.permissions.save(permission);
    return this.toView(saved, 0);
  }

  /** Elimina el permiso y lo quita de los roles y usuarios que lo tenían. */
  async remove(id: number) {
    const permission = await this.permissions.findOneBy({ id });
    if (!permission) throw new NotFoundException('Permiso no encontrado');
    if (SYSTEM_PERMISSION_NAMES.includes(permission.name)) {
      throw new BadRequestException('La app usa este permiso; puedes quitarlo de los roles pero no eliminarlo');
    }
    await this.permissions.manager.transaction(async (em) => {
      await em.query('DELETE FROM roles_permissions WHERE id_permission = ?', [id]);
      await em.query('DELETE FROM user_has_permissions WHERE id_permission = ?', [id]);
      await em.delete(Permission, { id });
    });
    return { id, deleted: true };
  }

  private toView(p: Permission & { rolesCount?: number }, usersCount: number) {
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      system: SYSTEM_PERMISSION_NAMES.includes(p.name),
      rolesCount: p.rolesCount ?? 0,
      usersCount,
    };
  }

  private async ensureUniqueName(name: string) {
    if (await this.permissions.findOneBy({ name })) throw new ConflictException(`Ya existe el permiso "${name}"`);
  }
}
