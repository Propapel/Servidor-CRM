import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('facturacion_renta')
export class FacturacionRenta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fechaFactura: number;

  @Column()
  limiteFactura: number;

  @Column()
  usoCfdi: string;

  @Column()
  metodoPago: string;

  @Column()
  formaPago: string;

  @Column()
  telefono: string;

  @Column()
  email: string;

  @Column()
  comentariosParaEjecutivo: string;

  @Column()
  comentariosFactura: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
