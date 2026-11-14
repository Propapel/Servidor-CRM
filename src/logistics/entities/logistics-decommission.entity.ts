import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export const DECOMMISSION_STATUSES = ['PENDIENTE', 'AUTORIZADA', 'RECHAZADA'] as const;
export type DecommissionStatus = (typeof DECOMMISSION_STATUSES)[number];

/**
 * Baja de un equipo. La solicita un técnico desde un ticket o alguien de Logística, y la
 * autoriza quien tenga el permiso logistica-autorizar-bajas. Guarda los datos del equipo
 * tal como estaban al pedir la baja.
 */
@Index('IDX_logistics_decommission_branch', ['branchId', 'status', 'createdAt'])
@Index('IDX_logistics_decommission_ticket', ['ticketId'])
@Entity('logistics_decommission')
export class LogisticsDecommission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  branchId: number;

  /** Impresora del inventario (si se encontró por id o por número de serie). */
  @Column({ type: 'int', nullable: true })
  printerId: number | null;

  @Column({ type: 'int', nullable: true })
  ticketId: number | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  ticketNumber: string | null;

  @Column({ type: 'varchar', length: 80 })
  brand: string;

  @Column({ type: 'varchar', length: 120 })
  model: string;

  @Column({ type: 'varchar', length: 80 })
  serialNumber: string;

  @Column({ type: 'int', nullable: true })
  counter: number | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  clientName: string | null;

  @Column({ type: 'varchar', length: 1000 })
  reason: string;

  @Column({ type: 'varchar', length: 20, default: 'PENDIENTE' })
  status: DecommissionStatus;

  @Column({ type: 'int', nullable: true })
  requestedBy: number | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  requestedByName: string | null;

  @Column({ type: 'int', nullable: true })
  reviewedBy: number | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  reviewedByName: string | null;

  @Column({ type: 'datetime', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  reviewNotes: string | null;

  /** Responsiva firmada y escaneada (PDF o imagen). */
  @Column({ type: 'varchar', length: 600, nullable: true })
  responsivaUrl: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  responsivaName: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
