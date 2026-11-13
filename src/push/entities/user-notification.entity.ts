import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** Categorías de aviso: la app permite apagar cada una. */
export type NotificationCategory = 'tickets' | 'leads' | 'chat' | 'system';

/** Bandeja de avisos de cada usuario: lo que llegó por push queda aquí aunque el equipo estuviera apagado. */
@Index('IDX_user_notification_user_date', ['userId', 'createdAt'])
@Entity('user_notification')
export class UserNotification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 20, default: 'system' })
  category: NotificationCategory;

  /** NEW_TICKET, TICKET_COMMENT, REMINDER_DUE, LEAD_MESSAGE, ... */
  @Column({ type: 'varchar', length: 40 })
  type: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 500, default: '' })
  body: string;

  /** Datos para abrir la pantalla correcta (ticketId, customerId, ...). */
  @Column({ type: 'simple-json', nullable: true })
  data: Record<string, string> | null;

  @Column({ type: 'datetime', nullable: true })
  readAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
