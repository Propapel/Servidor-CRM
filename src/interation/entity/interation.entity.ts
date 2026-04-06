import { Customer } from '../../customers/entity/customer.entity';
import { Opportunity } from '../../oportunity/entity/oportunity.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

@Entity('interactions')
export class Interaction {
  @PrimaryGeneratedColumn()
  interaction_id: number;

  @ManyToOne(() => Customer, customer => customer.interactions)
  customer: Customer;

  @Column()
  interaction_type: string;

  @Column({ type: 'bigint' })
  interaction_date: number;

  @Column({ nullable: true })
  notes: string;
}
