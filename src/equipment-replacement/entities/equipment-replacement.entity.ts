import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ReplacementStatus } from '../enum/replacement-status';
import { Client } from 'src/clients/entities/client.entity';

@Entity('equipment_replacement')
export class EquipmentReplacement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ReplacementStatus,
    default: ReplacementStatus.CREATED,
  })
  status: ReplacementStatus;

  @Column({ length: 100, nullable: true })
  removedSerial: string;

  @Column({ type: 'int', nullable: true })
  removedCounter: number;

  @Column({ length: 100 }) // No es 'nullable', siempre se instala uno
  installedSerial: string;

  @Column({ type: 'int', nullable: true }) // 'nullable' si el equipo no tiene contador
  installedCounter: number;

  @Column({ type: 'text', nullable: true })
  comments: string;

  @Column({ default: false })
  loadedToExternalSystem: boolean; // Para tu estado "CARGADO EN HURACAN"

  @Column({ type: 'datetime', nullable: true })
  executionDate: Date; // Cuándo se hizo el cambio físico

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

   @ManyToOne(() => Client, (client) => client.equipmentReplacements, {
      nullable: false
    })
    client: Client;
}
