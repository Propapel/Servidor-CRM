import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/** Formato de la hoja de servicio (PDF) de una sucursal. La app interpreta el JSON. */
@Entity('service_sheet_settings')
export class ServiceSheetSettings {
  /** Id de la sucursal (tabla sucursales). */
  @PrimaryColumn({ name: 'branch_id' })
  branchId: number;

  /** Formato completo; el logo va en base64 dentro, por eso es JSON (hasta ~1 GB en MySQL). */
  @Column({ type: 'json' })
  config: Record<string, unknown>;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'updated_by', type: 'int', nullable: true })
  updatedBy: number | null;
}
