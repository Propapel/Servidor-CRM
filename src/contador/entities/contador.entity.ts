import { Itequipment } from 'src/itequipments/entities/itequipment.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('contador')
export class Contador {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  contador: number;

  @Column({ type: 'datetime', nullable: true })
  fechaCapturada: Date;

  @ManyToOne(() => Itequipment, (equipo) => equipo.contadores, { eager: true })
  equipo: Itequipment;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
