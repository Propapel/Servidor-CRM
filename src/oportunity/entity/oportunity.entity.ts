import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { Customer } from '../../customers/entity/customer.entity';
import { Reminder } from '../../remider/entity/remider.entity';
import { Interaction } from '../../interation/entity/interation.entity';

@Entity('opportunities')
export class Opportunity {
  @PrimaryGeneratedColumn()
  opportunity_id: number;

  @ManyToOne(() => Customer, customer => customer.opportunities)
  customer: Customer;

  @Column()
  is_opportunity: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  potential_sale: number;

  @Column()
  status: string;


  @Column({ nullable: true })
  follow_up_tasks: string;
}
