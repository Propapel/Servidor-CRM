import { Customer } from '../../customers/entity/customer.entity';
import { Project } from '../../projects/entities/project.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

@Entity('purchases')
export class Purchase {
  @PrimaryGeneratedColumn()
  purchase_id: number;

  @ManyToOne(() => Customer, customer => customer.purchases)
  customer: Customer;

  @Column()
  product_service_name: string;

  @Column({ type: 'bigint' })
  purchase_date: number;

  @Column({ default: false })
  isIntoProduct: boolean;  

  @ManyToOne(() => Project, project => project.products)
  project: Project;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0.0 })
  amount: number;  
}
