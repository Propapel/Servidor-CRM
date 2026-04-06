import { Customer } from '../../customers/entity/customer.entity';
import { User } from '../../users/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('activity')
export class Activity {
  @PrimaryGeneratedColumn()
  activity_id: number;

  // Related customer
  @ManyToOne(() => Customer, customer => customer.activities)
  customer: Customer;

  // Short title for the activity
  @Column({ length: 100 })
  title: string;

  // Type of activity
  @Column({
    type: 'enum',
    enum: ['CALL', 'MEETING', 'TASK', 'EMAIL', 'OTHER', 'INPERSON'],
  })
  type: 'CALL' | 'MEETING' | 'TASK' | 'EMAIL' | 'OTHER'| 'IN_PERSON';

  // Detailed description
  @Column({ type: 'text' })
  description: string;

  // Creation date
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  // Last update date
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Soft delete
  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  // Start and end dates
  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  // Reminder
  @Column({ type: 'boolean', default: false })
  reminder: boolean;

  @Column({ type: 'timestamp', nullable: true })
  reminderDate: Date;

  // Status
  @Column({
    type: 'enum',
    enum: ['PENDING', 'COMPLETED', 'CANCELLED', 'IN_PROGRESS'],
    default: 'PENDING'
  })
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'IN_PROGRESS';

  // Priority
  @Column({
    type: 'enum',
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    default: 'MEDIUM'
  })
  priority: 'HIGH' | 'MEDIUM' | 'LOW';

  // Notes
  @Column({ type: 'text', nullable: true })
  notes: string;

  // Visibility
  @Column({ type: 'boolean', default: false })
  isPrivate: boolean;

  // Created by user
  @ManyToOne(() => User, { nullable: true })
  createdBy: User;

  // Last updated by user
  @ManyToOne(() => User, { nullable: true })
  updatedBy: User;

  // Category or tags
  @Column({ nullable: true })
  category: string;

  // Attachments (URLs or paths)
  @Column('simple-json', { nullable: true })
  attachments: string[];
}
