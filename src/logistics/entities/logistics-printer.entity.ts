import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export const PRINTER_STATUSES = ['DISPONIBLE', 'ASIGNADA', 'EN_REPARACION', 'BAJA'] as const;
export type PrinterStatus = (typeof PRINTER_STATUSES)[number];

/** Inventario de impresoras de Logística (independiente de itequipment, que son equipos instalados con clientes). */
@Index('IDX_logistics_printer_branch', ['branchId', 'status'])
@Entity('logistics_printer')
export class LogisticsPrinter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  branchId: number;

  @Column({ type: 'varchar', length: 80 })
  brand: string;

  @Column({ type: 'varchar', length: 120 })
  model: string;

  @Index('UQ_logistics_printer_serial', { unique: true })
  @Column({ type: 'varchar', length: 80 })
  serialNumber: string;

  /** Monocromática, Color, Multifuncional, ... */
  @Column({ type: 'varchar', length: 60, nullable: true })
  type: string | null;

  @Column({ type: 'varchar', length: 20, default: 'DISPONIBLE' })
  status: PrinterStatus;

  /** Último contador conocido. */
  @Column({ type: 'int', nullable: true })
  counter: number | null;

  /** Dónde está: almacén, cliente, taller. */
  @Column({ type: 'varchar', length: 200, nullable: true })
  location: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  clientName: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes: string | null;

  @Column({ type: 'int', nullable: true })
  createdBy: number | null;

  @Column({ type: 'datetime', nullable: true })
  decommissionedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
