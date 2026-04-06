import { Reminder } from '../../remider/entity/remider.entity';
import { User } from '../../users/user.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProspectingReason } from '../enum/prospecting_reason';
import { CalendarEventStatus } from '../enum/calendar_event_status';
import { Sucursales } from 'src/sucursales/entities/sucursale.entity';

@Entity()
export class CalendarEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: true })
  title?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: CalendarEventStatus,
    default: CalendarEventStatus.PLANNED,
  })
  status: CalendarEventStatus;

  @Column({
    type: 'enum',
    enum: ProspectingReason,
    default: ProspectingReason.COLD_PROSPECTION,
  })
  prospectingReason: ProspectingReason;

  @Column({ type: 'timestamp', nullable: true })
  activityDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  startTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime?: Date;

  @ManyToOne(() => Sucursales, (sucursal) => sucursal.calendarEvents, {
    eager: true,
  })
  sucursal: Sucursales;

  @Column({ nullable: true })
  location?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ManyToOne(() => User, (user) => user.events, { eager: true })
  createdBy: User;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToMany(() => User, (user) => user.participatingEvents, { eager: true })
  @JoinTable({
    name: 'calendar_event_participants',
    joinColumn: { name: 'calendar_event_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  participants: User[];

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToMany(() => Reminder, (reminder) => reminder.calendarEvent, {
    cascade: true,
  })
  reminders: Reminder[];

  @Column({ default: false })
  isDelete: boolean;
}
