import { Customer } from '../../customers/entity/customer.entity';
import { User } from '../../users/user.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('deals')
export class Deal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string; // (was "acuerdo")

  @Column()
  stage: string; // e.g. "Discovery", "Proposal", "Negotiation", "Closed Won"
 /*
  @ManyToOne(() => User, (user) => user.deals, { nullable: true })
  owner: User; // (was "responsable")
  //
    @Column('decimal', { precision: 15, scale: 2 })
  amount: number; // (was "valorDelAcuerdo")

  @ManyToMany(() => Customer, (customer) => customer.deals, { cascade: true })
  @JoinTable()
  customers: Customer[];

  @ManyToMany(() => Product, (product) => product.deals, {
    cascade: true,
    nullable: true,
  })
  @JoinTable()
  products: Product[]; // optional: link deal with multiple products

  @Column({ nullable: true })
  duration: string;

  @Column({ type: 'date', nullable: true })
  expectedCloseDate: Date;

  @Column('int', { nullable: true })
  closeProbability: number; // %

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  forecastAmount: number; // calculated or stored

  @Column({ type: 'datetime', nullable: true })
  closeDate: Date;

  // 🔹 Extra useful CRM fields
  @Column({ nullable: true })
  source: string; // e.g. "Website", "Referral", "Cold Call"

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  status: string; // e.g. "Active", "Closed Won", "Closed Lost"

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date; 
  */

}
