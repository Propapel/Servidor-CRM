import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('type_of_report')
export class TypeOfReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  // Solo se guarda el id de la sucursal (sin relación)
  @Column({ nullable: true })
  sucursalId: number;

  // Nuevo: color asociado al tipo de reporte (ej: #FF0000, blue, etc.)
  @Column({ nullable: true, length: 20 })
  color: string;

  // Nuevo: icono asociado (puedes guardar nombre de ícono, path o URL)
  @Column({ nullable: true })
  icon: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
