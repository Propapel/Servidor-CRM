import { Injectable, Logger, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ADMIN_PERMISSIONS } from '../admin/admin-access';
import { Sucursales } from '../sucursales/entities/sucursale.entity';
import { DEFAULT_SERVICE_SHEET, ServiceSheetConfig, UpsertServiceSheetDto } from './dto/service-sheet.dto';
import { ServiceSheetSettings } from './entities/service-sheet-settings.entity';

/** Roles que reciben el permiso al crearlo: gerente regional (2) y gerente de soporte (6). */
const DEFAULT_PERMISSION_ROLES = ['2', '6'];

@Injectable()
export class ServiceSheetService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ServiceSheetService.name);

  constructor(
    @InjectRepository(ServiceSheetSettings) private readonly settings: Repository<ServiceSheetSettings>,
    @InjectRepository(Sucursales) private readonly branches: Repository<Sucursales>,
    private readonly dataSource: DataSource,
  ) {}

  /** 404 si la sucursal no tiene formato: la app usa el predeterminado. */
  async get(branchId: number): Promise<ServiceSheetConfig> {
    const row = await this.settings.findOneBy({ branchId });
    if (!row) throw new NotFoundException('La sucursal todavía no tiene formato de hoja de servicio');
    return this.normalize(row.config);
  }

  /** Reemplaza el formato completo; lo que no venga toma el valor predeterminado. */
  async upsert(branchId: number, dto: UpsertServiceSheetDto, userId?: number): Promise<ServiceSheetConfig> {
    const exists = await this.branches.exist({ where: { id: branchId } });
    if (!exists) throw new NotFoundException('Sucursal no encontrada');
    const config = this.normalize(dto as Record<string, unknown>);
    await this.settings.save({ branchId, config: config as unknown as Record<string, unknown>, updatedBy: userId ?? null });
    return config;
  }

  private normalize(input: Record<string, unknown>): ServiceSheetConfig {
    const out: ServiceSheetConfig = { ...DEFAULT_SERVICE_SHEET };
    for (const key of Object.keys(DEFAULT_SERVICE_SHEET) as (keyof ServiceSheetConfig)[]) {
      if (input?.[key] !== undefined) (out as any)[key] = input[key];
    }
    if (typeof out.title === 'string') out.title = out.title.trim();
    if (typeof out.logoBase64 === 'string') out.logoBase64 = out.logoBase64.replace(/\s/g, '') || null;
    out.footerLines = (out.footerLines ?? []).map((l) => String(l).trim()).filter(Boolean);
    out.serviceTypes = (out.serviceTypes ?? []).map((l) => String(l).trim()).filter(Boolean);
    return out;
  }

  /**
   * Crea el permiso administracion-hoja-servicio y se lo da a los roles 2 y 6 la primera vez.
   * Si ya existe no toca nada (así se respetan los cambios hechos en Roles y permisos).
   */
  async onApplicationBootstrap() {
    const name = ADMIN_PERMISSIONS.SERVICE_SHEET;
    try {
      const existing = await this.dataSource.query('SELECT id FROM permission WHERE name = ? LIMIT 1', [name]);
      if (existing.length) return;
      const result = await this.dataSource.query('INSERT INTO permission (name, description) VALUES (?, ?)', [
        name, 'Administración: formato de la hoja de servicio',
      ]);
      const permissionId = result.insertId;
      for (const roleId of DEFAULT_PERMISSION_ROLES) {
        await this.dataSource.query(
          'INSERT IGNORE INTO roles_permissions (id_rol, id_permission) SELECT id, ? FROM roles WHERE id = ?',
          [permissionId, roleId],
        );
      }
      this.logger.log(`Permiso ${name} creado y asignado a los roles ${DEFAULT_PERMISSION_ROLES.join(', ')}`);
    } catch (e) {
      this.logger.warn(`No se pudo registrar el permiso ${name}: ${(e as Error).message}`);
    }
  }
}
