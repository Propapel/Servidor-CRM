import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Customer } from '../../customers/entity/customer.entity';
import { Opportunity } from '../../oportunity/entity/oportunity.entity';
import { CalendarEvent } from '../../calendar-event/entities/calendar-event.entity';

@Entity('reminders')
export class Reminder {
  @PrimaryGeneratedColumn()
  reminder_id: number;

  @ManyToOne(() => Customer, (customer) => customer.reminders)
  customer: Customer;

  @Column()
  typeAppointment: string;

  @Column({default: false})
  isProspectingCold: boolean;

  @Column({ type: 'bigint' })
  reminder_date: number;

  @ManyToOne(() => CalendarEvent, (calendarEvent) => calendarEvent.reminders)
  calendarEvent: CalendarEvent;

  @Column()
  description: string;

  @Column({ default: false })
  is_completed: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
