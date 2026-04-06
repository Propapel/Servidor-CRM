import { LeadAction } from '../../enums/lead-action';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class LeadHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  customerId: number;

  @Column({
    type: 'enum',
    enum: LeadAction,
  })
  action: LeadAction;

  @Column()
  performedById: number; // gerente o ejecutivo

  @CreateDateColumn()
  performedAt: Date;

  @Column({ nullable: true }) // ✅ Corrección aquí
  userAnteriorAssing: number;

  @Column({ nullable: true }) // ✅ Corrección aquí
  userAssigned: number;

  @Column({ nullable: true })
  notes: string;
}
