import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export const SHIPMENT_TYPES = ['PIEZA', 'TONER', 'IMPRESORA', 'OTRO'] as const;
export type ShipmentType = (typeof SHIPMENT_TYPES)[number];
export const SHIPMENT_STATUSES = ['PENDIENTE', 'ENVIADO', 'ENTREGADO', 'CANCELADO'] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

/** Envío de piezas, tóners o impresoras, con su guía de paquetería. */
@Index('IDX_logistics_shipment_branch', ['branchId', 'status', 'createdAt'])
@Entity('logistics_shipment')
export class LogisticsShipment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  branchId: number;

  @Column({ type: 'varchar', length: 20 })
  type: ShipmentType;

  @Column({ type: 'varchar', length: 300 })
  description: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'varchar', length: 20, default: 'PENDIENTE' })
  status: ShipmentStatus;

  /** Paquetería: DHL, Estafeta, FedEx, entrega propia... */
  @Column({ type: 'varchar', length: 80, nullable: true })
  carrier: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  trackingNumber: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  recipientName: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  recipientPhone: string | null;

  @Column({ type: 'varchar', length: 400, nullable: true })
  destination: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  clientName: string | null;

  /** Ticket relacionado (opcional). */
  @Column({ type: 'int', nullable: true })
  ticketId: number | null;

  /** Impresora del inventario que se envía (opcional). */
  @Column({ type: 'int', nullable: true })
  printerId: number | null;

  /** Guía subida (PDF o imagen). */
  @Column({ type: 'varchar', length: 600, nullable: true })
  guideUrl: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  guideName: string | null;

  @Column({ type: 'datetime', nullable: true })
  shippedAt: Date | null;

  @Column({ type: 'datetime', nullable: true })
  deliveredAt: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes: string | null;

  @Column({ type: 'int', nullable: true })
  createdBy: number | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  createdByName: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
