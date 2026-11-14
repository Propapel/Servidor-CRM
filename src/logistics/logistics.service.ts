import {
  BadRequestException, ConflictException, Injectable, Logger, NotFoundException, OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ADMIN_PERMISSIONS } from '../admin/admin-access';
import { likeTerm } from '../common/pagination/page-query.dto';
import { normalizePage, toPagedResponse } from '../common/pagination/paged-response';
import { User } from '../users/user.entity';
import {
  CreateDecommissionDto, CreatePrinterDto, CreateShipmentDto, UpdatePrinterDto, UpdateShipmentDto, UploadFileDto,
} from './dto/logistics.dto';
import { DECOMMISSION_STATUSES, LogisticsDecommission } from './entities/logistics-decommission.entity';
import { LogisticsPrinter, PRINTER_STATUSES } from './entities/logistics-printer.entity';
import { LogisticsShipment, SHIPMENT_STATUSES, SHIPMENT_TYPES } from './entities/logistics-shipment.entity';
import storage = require('../utils/cloud_storage.js');

const MAX_FILE_BYTES = 8 * 1024 * 1024;
/** Roles que reciben los permisos al crearlos: gerente regional (2) y gerente de soporte (6). */
const DEFAULT_PERMISSION_ROLES = ['2', '6'];

export interface ListQuery {
  branchId?: number;
  status?: string;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

const clean = (value?: string | null) => (typeof value === 'string' && value.trim() ? value.trim() : null);

/** PDF, PNG o JPG según los primeros bytes. */
export function detectFileType(bytes: Buffer): { ext: string; contentType: string } | null {
  if (bytes.length >= 4 && bytes.subarray(0, 4).toString('latin1') === '%PDF') return { ext: 'pdf', contentType: 'application/pdf' };
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return { ext: 'png', contentType: 'image/png' };
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8) return { ext: 'jpg', contentType: 'image/jpeg' };
  return null;
}

@Injectable()
export class LogisticsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(LogisticsService.name);

  constructor(
    @InjectRepository(LogisticsPrinter) private readonly printers: Repository<LogisticsPrinter>,
    @InjectRepository(LogisticsShipment) private readonly shipments: Repository<LogisticsShipment>,
    @InjectRepository(LogisticsDecommission) private readonly decommissions: Repository<LogisticsDecommission>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  // ------------------------------------------------------------------ resumen

  async summary(branchId?: number) {
    const where = branchId ? { branchId } : {};
    const [byStatus, pendingShipments, pendingDecommissions] = await Promise.all([
      this.printers.createQueryBuilder('p').select('p.status', 'status').addSelect('COUNT(*)', 'total')
        .where(branchId ? 'p.branchId = :branchId' : '1=1', { branchId }).groupBy('p.status').getRawMany<{ status: string; total: string }>(),
      this.shipments.count({ where: { ...where, status: 'PENDIENTE' } }),
      this.decommissions.count({ where: { ...where, status: 'PENDIENTE' } }),
    ]);
    const printers: Record<string, number> = Object.fromEntries(PRINTER_STATUSES.map((s) => [s, 0]));
    byStatus.forEach((r) => (printers[r.status] = Number(r.total)));
    return { printers, pendingShipments, pendingDecommissions };
  }

  // ------------------------------------------------------------------ inventario

  async listPrinters(q: ListQuery, request?: any) {
    const { page, limit, offset } = normalizePage(q.page, q.limit);
    const qb = this.printers.createQueryBuilder('p');
    if (q.branchId) qb.andWhere('p.branchId = :branchId', { branchId: q.branchId });
    if (q.status && (PRINTER_STATUSES as readonly string[]).includes(q.status)) qb.andWhere('p.status = :status', { status: q.status });
    const term = likeTerm(q.search);
    if (term) qb.andWhere('(p.serialNumber LIKE :t OR p.model LIKE :t OR p.brand LIKE :t OR p.clientName LIKE :t OR p.location LIKE :t)', { t: term });
    const [rows, total] = await qb.orderBy('p.updatedAt', 'DESC').addOrderBy('p.id', 'DESC').skip(offset).take(limit).getManyAndCount();
    return toPagedResponse(rows, total, page, limit, request);
  }

  async createPrinter(dto: CreatePrinterDto, userId?: number) {
    const serialNumber = dto.serialNumber.trim().toUpperCase();
    if (await this.printers.findOneBy({ serialNumber })) {
      throw new ConflictException(`Ya hay una impresora con el número de serie ${serialNumber}`);
    }
    return this.printers.save(this.printers.create({
      branchId: dto.branchId, brand: dto.brand.trim(), model: dto.model.trim(), serialNumber,
      type: clean(dto.type), status: dto.status ?? 'DISPONIBLE', counter: dto.counter ?? null,
      location: clean(dto.location), clientName: clean(dto.clientName), notes: clean(dto.notes), createdBy: userId ?? null,
    }));
  }

  async updatePrinter(id: number, dto: UpdatePrinterDto) {
    const printer = await this.printers.findOneBy({ id });
    if (!printer) throw new NotFoundException('Impresora no encontrada');
    if (printer.status === 'BAJA') throw new BadRequestException('La impresora está dada de baja y ya no se puede editar');
    if (dto.serialNumber !== undefined) {
      const serialNumber = dto.serialNumber.trim().toUpperCase();
      const other = await this.printers.findOneBy({ serialNumber });
      if (other && other.id !== id) throw new ConflictException(`Ya hay una impresora con el número de serie ${serialNumber}`);
      printer.serialNumber = serialNumber;
    }
    if (dto.branchId !== undefined) printer.branchId = dto.branchId;
    if (dto.brand !== undefined) printer.brand = dto.brand.trim();
    if (dto.model !== undefined) printer.model = dto.model.trim();
    if (dto.type !== undefined) printer.type = clean(dto.type);
    if (dto.status !== undefined) printer.status = dto.status;
    if (dto.counter !== undefined) printer.counter = dto.counter;
    if (dto.location !== undefined) printer.location = clean(dto.location);
    if (dto.clientName !== undefined) printer.clientName = clean(dto.clientName);
    if (dto.notes !== undefined) printer.notes = clean(dto.notes);
    return this.printers.save(printer);
  }

  // ------------------------------------------------------------------ envíos

  async listShipments(q: ListQuery, request?: any) {
    const { page, limit, offset } = normalizePage(q.page, q.limit);
    const qb = this.shipments.createQueryBuilder('s');
    if (q.branchId) qb.andWhere('s.branchId = :branchId', { branchId: q.branchId });
    if (q.status && (SHIPMENT_STATUSES as readonly string[]).includes(q.status)) qb.andWhere('s.status = :status', { status: q.status });
    if (q.type && (SHIPMENT_TYPES as readonly string[]).includes(q.type)) qb.andWhere('s.type = :type', { type: q.type });
    const term = likeTerm(q.search);
    if (term) qb.andWhere('(s.description LIKE :t OR s.trackingNumber LIKE :t OR s.recipientName LIKE :t OR s.clientName LIKE :t OR s.carrier LIKE :t)', { t: term });
    const [rows, total] = await qb.orderBy('s.createdAt', 'DESC').addOrderBy('s.id', 'DESC').skip(offset).take(limit).getManyAndCount();
    return toPagedResponse(rows, total, page, limit, request);
  }

  async createShipment(dto: CreateShipmentDto, userId?: number) {
    const shipment = this.shipments.create({
      branchId: dto.branchId, type: dto.type, description: dto.description.trim(), quantity: dto.quantity ?? 1,
      status: 'PENDIENTE', carrier: clean(dto.carrier), trackingNumber: clean(dto.trackingNumber),
      recipientName: clean(dto.recipientName), recipientPhone: clean(dto.recipientPhone), destination: clean(dto.destination),
      clientName: clean(dto.clientName), ticketId: dto.ticketId ?? null, printerId: dto.printerId ?? null, notes: clean(dto.notes),
      createdBy: userId ?? null, createdByName: await this.userName(userId),
    });
    this.applyShipmentStatus(shipment, dto.status ?? 'PENDIENTE');
    return this.shipments.save(shipment);
  }

  async updateShipment(id: number, dto: UpdateShipmentDto) {
    const shipment = await this.shipments.findOneBy({ id });
    if (!shipment) throw new NotFoundException('Envío no encontrado');
    if (dto.type !== undefined) shipment.type = dto.type;
    if (dto.description !== undefined) shipment.description = dto.description.trim();
    if (dto.quantity !== undefined) shipment.quantity = dto.quantity;
    if (dto.carrier !== undefined) shipment.carrier = clean(dto.carrier);
    if (dto.trackingNumber !== undefined) shipment.trackingNumber = clean(dto.trackingNumber);
    if (dto.recipientName !== undefined) shipment.recipientName = clean(dto.recipientName);
    if (dto.recipientPhone !== undefined) shipment.recipientPhone = clean(dto.recipientPhone);
    if (dto.destination !== undefined) shipment.destination = clean(dto.destination);
    if (dto.clientName !== undefined) shipment.clientName = clean(dto.clientName);
    if (dto.ticketId !== undefined) shipment.ticketId = dto.ticketId;
    if (dto.printerId !== undefined) shipment.printerId = dto.printerId;
    if (dto.notes !== undefined) shipment.notes = clean(dto.notes);
    if (dto.status !== undefined) this.applyShipmentStatus(shipment, dto.status);
    return this.shipments.save(shipment);
  }

  /** Guarda las fechas de envío y entrega la primera vez que se llega a cada estado. */
  private applyShipmentStatus(shipment: LogisticsShipment, status: LogisticsShipment['status']) {
    shipment.status = status;
    if ((status === 'ENVIADO' || status === 'ENTREGADO') && !shipment.shippedAt) shipment.shippedAt = new Date();
    if (status === 'ENTREGADO' && !shipment.deliveredAt) shipment.deliveredAt = new Date();
  }

  async uploadGuide(id: number, dto: UploadFileDto) {
    const shipment = await this.shipments.findOneBy({ id });
    if (!shipment) throw new NotFoundException('Envío no encontrado');
    shipment.guideUrl = await this.storeFile(dto, `logistica/guias/envio_${id}`);
    shipment.guideName = dto.fileName.trim().slice(0, 200);
    return this.shipments.save(shipment);
  }

  // ------------------------------------------------------------------ bajas

  async listDecommissions(q: ListQuery, request?: any) {
    const { page, limit, offset } = normalizePage(q.page, q.limit);
    const qb = this.decommissions.createQueryBuilder('d');
    if (q.branchId) qb.andWhere('d.branchId = :branchId', { branchId: q.branchId });
    if (q.status && (DECOMMISSION_STATUSES as readonly string[]).includes(q.status)) qb.andWhere('d.status = :status', { status: q.status });
    const term = likeTerm(q.search);
    if (term) qb.andWhere('(d.serialNumber LIKE :t OR d.model LIKE :t OR d.brand LIKE :t OR d.clientName LIKE :t OR d.ticketNumber LIKE :t)', { t: term });
    const [rows, total] = await qb.orderBy('d.createdAt', 'DESC').addOrderBy('d.id', 'DESC').skip(offset).take(limit).getManyAndCount();
    return toPagedResponse(rows, total, page, limit, request);
  }

  byTicket(ticketId: number) {
    return this.decommissions.find({ where: { ticketId }, order: { createdAt: 'DESC' } });
  }

  /** Solicitud de baja (queda PENDIENTE hasta que alguien con permiso la autorice). */
  async requestDecommission(dto: CreateDecommissionDto, userId?: number) {
    const serialNumber = dto.serialNumber.trim().toUpperCase();
    const pending = await this.decommissions.findOneBy({ serialNumber, status: 'PENDIENTE' });
    if (pending) throw new ConflictException(`Ya hay una baja pendiente de autorizar para la serie ${serialNumber}`);

    // Se liga al inventario por id o, si no viene, por número de serie
    const printer = dto.printerId
      ? await this.printers.findOneBy({ id: dto.printerId })
      : await this.printers.findOneBy({ serialNumber });
    if (dto.printerId && !printer) throw new NotFoundException('Impresora no encontrada en el inventario');
    if (printer?.status === 'BAJA') throw new BadRequestException('Esa impresora ya está dada de baja');

    return this.decommissions.save(this.decommissions.create({
      branchId: dto.branchId, printerId: printer?.id ?? null, ticketId: dto.ticketId ?? null, ticketNumber: clean(dto.ticketNumber),
      brand: dto.brand.trim(), model: dto.model.trim(), serialNumber, counter: dto.counter ?? null,
      clientName: clean(dto.clientName), reason: dto.reason.trim(), status: 'PENDIENTE',
      requestedBy: userId ?? null, requestedByName: await this.userName(userId),
    }));
  }

  /** Autoriza la baja y marca la impresora del inventario como BAJA con su último contador. */
  async authorize(id: number, userId?: number, notes?: string) {
    const baja = await this.pendingOrFail(id);
    return this.dataSource.transaction(async (tx) => {
      baja.status = 'AUTORIZADA';
      baja.reviewedBy = userId ?? null;
      baja.reviewedByName = await this.userName(userId);
      baja.reviewedAt = new Date();
      baja.reviewNotes = clean(notes);
      const printerRepo = tx.getRepository(LogisticsPrinter);
      const printer = baja.printerId
        ? await printerRepo.findOneBy({ id: baja.printerId })
        : await printerRepo.findOneBy({ serialNumber: baja.serialNumber });
      if (printer) {
        printer.status = 'BAJA';
        printer.decommissionedAt = new Date();
        if (baja.counter != null) printer.counter = baja.counter;
        await printerRepo.save(printer);
        baja.printerId = printer.id;
      }
      return tx.getRepository(LogisticsDecommission).save(baja);
    });
  }

  async reject(id: number, userId?: number, notes?: string) {
    const baja = await this.pendingOrFail(id);
    if (!clean(notes)) throw new BadRequestException('Escribe el motivo del rechazo');
    baja.status = 'RECHAZADA';
    baja.reviewedBy = userId ?? null;
    baja.reviewedByName = await this.userName(userId);
    baja.reviewedAt = new Date();
    baja.reviewNotes = clean(notes);
    return this.decommissions.save(baja);
  }

  async uploadResponsiva(id: number, dto: UploadFileDto) {
    const baja = await this.decommissions.findOneBy({ id });
    if (!baja) throw new NotFoundException('Baja no encontrada');
    baja.responsivaUrl = await this.storeFile(dto, `logistica/responsivas/baja_${id}`);
    baja.responsivaName = dto.fileName.trim().slice(0, 200);
    return this.decommissions.save(baja);
  }

  private async pendingOrFail(id: number) {
    const baja = await this.decommissions.findOneBy({ id });
    if (!baja) throw new NotFoundException('Baja no encontrada');
    if (baja.status !== 'PENDIENTE') throw new BadRequestException('Esta baja ya fue revisada');
    return baja;
  }

  // ------------------------------------------------------------------ internos

  private async userName(userId?: number) {
    if (!userId) return null;
    const user = await this.users.findOne({ where: { id: userId }, select: { id: true, name: true, lastname: true } });
    return user ? `${user.name ?? ''} ${user.lastname ?? ''}`.trim() || null : null;
  }

  private async storeFile(dto: UploadFileDto, pathPrefix: string): Promise<string> {
    const base64 = dto.fileBase64.replace(/^data:[^,]*,/, '').replace(/\s/g, '');
    const bytes = Buffer.from(base64, 'base64');
    if (!bytes.length) throw new BadRequestException('El archivo está vacío');
    if (bytes.length > MAX_FILE_BYTES) throw new BadRequestException('El archivo pesa más de 8 MB');
    const type = detectFileType(bytes);
    if (!type) throw new BadRequestException('Solo se aceptan archivos PDF, PNG o JPG');
    try {
      return await storage.uploadFromBuffer(bytes, `${pathPrefix}_${Date.now()}.${type.ext}`, type.contentType);
    } catch (e) {
      this.logger.warn(`No se pudo subir ${pathPrefix}: ${(e as Error).message}`);
      throw new BadRequestException('No se pudo guardar el archivo. Inténtalo de nuevo.');
    }
  }

  /** Crea los permisos de Logística y los asigna a los roles 2 y 6 la primera vez; si ya existen no toca nada. */
  async onApplicationBootstrap() {
    const permissions: [string, string][] = [
      [ADMIN_PERMISSIONS.LOGISTICS, 'Logística: envíos, inventario de impresoras y bajas'],
      [ADMIN_PERMISSIONS.LOGISTICS_AUTHORIZE, 'Logística: autorizar o rechazar bajas de equipos'],
    ];
    for (const [name, description] of permissions) {
      try {
        const existing = await this.dataSource.query('SELECT id FROM permission WHERE name = ? LIMIT 1', [name]);
        if (existing.length) continue;
        const result = await this.dataSource.query('INSERT INTO permission (name, description) VALUES (?, ?)', [name, description]);
        for (const roleId of DEFAULT_PERMISSION_ROLES) {
          await this.dataSource.query(
            'INSERT IGNORE INTO roles_permissions (id_rol, id_permission) SELECT id, ? FROM roles WHERE id = ?',
            [result.insertId, roleId],
          );
        }
        this.logger.log(`Permiso ${name} creado y asignado a los roles ${DEFAULT_PERMISSION_ROLES.join(', ')}`);
      } catch (e) {
        this.logger.warn(`No se pudo registrar el permiso ${name}: ${(e as Error).message}`);
      }
    }
  }
}
