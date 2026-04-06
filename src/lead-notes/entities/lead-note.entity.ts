import { Customer } from '../../customers/entity/customer.entity';
import { User } from '../../users/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinTable,
  ManyToMany,
} from 'typeorm';

@Entity('lead_notes')
export class LeadNote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @ManyToOne(() => User, (user) => user.notes, { eager: true })
  author: User;

  @ManyToOne(() => Customer, (customer) => customer.notes, {
    onDelete: 'CASCADE',
  })
  customer: Customer;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'lead_note_reads',
    joinColumn: { name: 'note_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  read_by: User[];
}
