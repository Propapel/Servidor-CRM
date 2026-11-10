import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { Client } from '../clients/entities/client.entity';
import { likeTerm } from '../common/pagination/page-query.dto';
import { normalizePage, safeUserSelect, toPagedResponse } from '../common/pagination/paged-response';
import { NotificationRecipient } from '../notifications/entities/notification-recipient.entity';
import { NotificationSmtpConfig } from '../notifications/entities/notification-smtp-config.entity';
import { Sucursales } from '../sucursales/entities/sucursale.entity';
import { Ticket } from '../ticket/entities/ticket.entity';
import { User } from '../users/user.entity';
import { UpsertBranchDto } from './dto/admin.dto';

@Injectable()
export class BranchesAdminService {
  constructor(
    @InjectRepository(Sucursales) private readonly branches: Repository<Sucursales>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Ticket) private readonly tickets: Repository<Ticket>,
    @InjectRepository(Client) private readonly clients: Repository<Client>,
  ) {}

  /** Sucursales con cuántos usuarios, tickets y clientes tienen. */
  async list() {
    const [branches, users, tickets, clients] = await Promise.all([
      this.branches.find({ order: { nombre: 'ASC' } }),
      this.branches.manager.query('SELECT sucursal_id AS id, COUNT(*) AS total FROM usuarios_sucursales GROUP BY sucursal_id'),
      this.tickets.createQueryBuilder('t').select('t.sucursalId', 'id').addSelect('COUNT(*)', 'total')
        .where('t.isDelete = :d', { d: false }).groupBy('t.sucursalId').getRawMany(),
      this.clients.createQueryBuilder('c').select('c.sucursalId', 'id').addSelect('COUNT(*)', 'total')
        .where('c.isDelete = :d', { d: false }).groupBy('c.sucursalId').getRawMany(),
    ]);
    const toMap = (rows: { id: number; total: string }[]) => new Map(rows.map((r) => [Number(r.id), Number(r.total)]));
    const [u, t, c] = [toMap(users), toMap(tickets), toMap(clients)];
    return branches.map((b) => this.toView(b, u.get(b.id) ?? 0, t.get(b.id) ?? 0, c.get(b.id) ?? 0));
  }

  async create(dto: UpsertBranchDto) {
    await this.ensureUniqueName(dto.nombre);
    const saved = await this.branches.save(this.branches.create(this.clean(dto)));
    return this.toView(saved, 0, 0, 0);
  }

  async update(id: number, dto: UpsertBranchDto) {
    const branch = await this.branches.findOneBy({ id });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');
    await this.ensureUniqueName(dto.nombre, id);
    Object.assign(branch, this.clean(dto), { updated_at: new Date() });
    await this.branches.save(branch);
    return (await this.list()).find((b) => b.id === id);
  }

  /** Solo se elimina si no tiene usuarios, tickets ni clientes (para no perder historial). */
  async remove(id: number) {
    const view = (await this.list()).find((b) => b.id === id);
    if (!view) throw new NotFoundException('Sucursal no encontrada');
    const uses = [
      view.usersCount && `${view.usersCount} usuario(s)`,
      view.ticketsCount && `${view.ticketsCount} ticket(s)`,
      view.clientsCount && `${view.clientsCount} cliente(s)`,
    ].filter(Boolean);
    if (uses.length) {
      throw new ConflictException(`No se puede eliminar: la sucursal tiene ${uses.join(', ')}. Muévelos a otra sucursal primero`);
    }
    await this.branches.manager.transaction(async (em) => {
      await em.delete(NotificationRecipient, { branchId: id });
      await em.delete(NotificationSmtpConfig, { branchId: id });
      await em.delete(Sucursales, { id });
    });
    return { id, deleted: true };
  }

  /** Usuarios asignados a la sucursal (paginado). */
  async usersOf(id: number, query: { page?: number; limit?: number; search?: string }, request?: Request) {
    const { page, limit, offset } = normalizePage(query.page, query.limit);
    const term = likeTerm(query.search);
    const qb = this.users
      .createQueryBuilder('user')
      .select([...safeUserSelect('user'), 'user.isDelete'])
      .innerJoin('user.sucursales', 'filter', 'filter.id = :id', { id })
      .leftJoinAndSelect('user.roles', 'rol');
    if (term) qb.andWhere('(user.name LIKE :term OR user.lastname LIKE :term OR user.email LIKE :term)', { term });
    const [results, total] = await qb.orderBy('user.name', 'ASC').addOrderBy('user.id', 'ASC').skip(offset).take(limit).getManyAndCount();
    return toPagedResponse(results, total, page, limit, request);
  }

  async addUser(id: number, userId: number) {
    const branch = await this.branches.findOneBy({ id });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');
    const user = await this.users.findOne({ where: { id: userId }, relations: ['sucursales'] });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (!user.sucursales.some((s) => s.id === id)) {
      user.sucursales = [...user.sucursales, branch];
      await this.users.save(user);
    }
    return { userId, branchId: id, branches: user.sucursales.map((s) => ({ id: s.id, nombre: s.nombre })) };
  }

  /** Quita al usuario de la sucursal; nunca lo deja sin ninguna (la app usa la primera). */
  async removeUser(id: number, userId: number) {
    const user = await this.users.findOne({ where: { id: userId }, relations: ['sucursales'] });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (!user.sucursales.some((s) => s.id === id)) return { userId, branchId: id, removed: false };
    if (user.sucursales.length === 1) {
      throw new BadRequestException('El usuario debe tener al menos una sucursal: asígnale otra antes de quitar esta');
    }
    user.sucursales = user.sucursales.filter((s) => s.id !== id);
    await this.users.save(user);
    return { userId, branchId: id, removed: true };
  }

  private clean(dto: UpsertBranchDto) {
    return {
      nombre: dto.nombre.trim(),
      abbreviation: dto.abbreviation?.trim().toUpperCase() || null,
      direccion: dto.direccion.trim(),
      numberContact: dto.numberContact?.trim() || null,
      image: dto.image?.trim() || null,
    };
  }

  private toView(b: Sucursales, usersCount: number, ticketsCount: number, clientsCount: number) {
    return {
      id: b.id,
      nombre: b.nombre,
      abbreviation: b.abbreviation,
      direccion: b.direccion,
      numberContact: b.numberContact,
      image: b.image,
      usersCount,
      ticketsCount,
      clientsCount,
      createdAt: b.created_at,
    };
  }

  private async ensureUniqueName(nombre: string, exceptId?: number) {
    const existing = await this.branches.createQueryBuilder('b').where('LOWER(b.nombre) = LOWER(:nombre)', { nombre: nombre.trim() }).getOne();
    if (existing && existing.id !== exceptId) throw new ConflictException(`Ya existe la sucursal "${nombre.trim()}"`);
  }
}
