import { User } from '../../users/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  // ❌ No usar default aquí
  @Column('simple-json', { nullable: true })
  steps: string[];

  @Column({ type: 'datetime', nullable: true })
  reminderDate: Date;

  @Column({ default: false })
  isImportant: boolean;

  @Column()
  note: string;

  @Column({ default: false })
  isComplete: boolean;

  // ❌ No usar default aquí
  @Column('simple-json', { nullable: true })
  files: string[];

  // ✅ Relación con el usuario que creó la tarea
  @ManyToOne(() => User, (user) => user.tasks, {
    eager: false,
    nullable: false,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
  

  @Column({ default: false })
  isDeleted: boolean; // Marca si la tarea fue eliminada lógicamente

  @Column({ type: 'datetime', nullable: true })
  finishTask: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
