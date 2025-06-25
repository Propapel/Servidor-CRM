import {
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/users/user.entity';
import { TicketStatus } from '../enum/ticiket_report_status';
import { TicketPriority } from '../enum/ticket_priority';
import { TypeOfReport } from '../enum/kind_report';
import { TicketUpdate } from 'src/ticket-updated/entities/ticket-updated.entity';
import { TicketComment } from 'src/ticket-comment/entities/ticket-comment.entity';

@Entity('ticket')
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: false })
  createdBy: User;

  @Column()
  nameReported: string;

  @Column()
  apartamentReport: string;

  @Column()
  phoneReport: string;

  @Column()
  emailReport: string;

  @Column()
  reasonReport: string;

  @Column({ nullable: true })
  location: string;

  @Column('simple-json', { nullable: true })
  files: string[];

  @Column({ nullable: true })
  pdfPageService: string;

  @Column({ nullable: true })
  serviceRating: number;

  @Column({ type: 'datetime', nullable: true })
  dateAssigment: Date;

  @Column({ default: false })
  resolved: boolean;

  @Column({ type: 'datetime', nullable: true })
  resolvedAt: Date;

  @ManyToMany(() => User, { cascade: false })
  @JoinTable()
  assigmentsTechnical: User[];

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.SIN_ASIGNAR,
  })
  status: TicketStatus;

  @Column({
    type: 'enum',
    enum: TicketPriority,
    default: TicketPriority.BAJA,
  })
  priority: TicketPriority;

  @Column({
    type: 'enum',
    enum: TypeOfReport,
  })
  typeOfReport: TypeOfReport;

  @OneToMany(() => TicketUpdate, (update) => update.ticket, { cascade: true })
  updates: TicketUpdate[];

  @OneToMany(() => TicketComment, (comment) => comment.ticket, { cascade: true })
  comments: TicketComment[];

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
