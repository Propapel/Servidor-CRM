import { Ticket } from '../../ticket/entities/ticket.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('type_of_report')
export class TypeOfReportEntity {
  @PrimaryGeneratedColumn()
  id: number; // <-- ID Numérico (Ej: 1)

  @Column({ length: 50, nullable: true }) // <-- ¡COLUMNA PUENTE!
  migrationCode: string; // <-- Guardará 'FAILURE', 'REPLACEMENT', etc.

  @Column()
  name: string; // <-- 'Falla de Equipo'

  @Column({ nullable: true })
  description: string;

  // ... (el resto de tus columnas: sucursalId, color, icon, etc.)
  @Column({ nullable: true })
  sucursalId: number;

  @Column({ nullable: true, length: 20 })
  color: string;

  @Column({ nullable: true })
  icon: string;

  @OneToMany(() => Ticket, (ticket) => ticket.typeOfReportEntity) // <-- ¡CORRECTO!
  tickets: Ticket[];
  // ... (createdAt, updatedAt)
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}