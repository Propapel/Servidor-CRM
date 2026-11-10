import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { NotificationEvent } from '../notification-events';

/** Quién recibe el correo de un evento en una sucursal. */
@Entity('notification_recipient')
@Index('UQ_notification_recipient', ['branchId', 'event', 'email'], { unique: true })
export class NotificationRecipient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  branchId: number;

  @Column({ type: 'enum', enum: NotificationEvent })
  event: NotificationEvent;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 120, nullable: true })
  name: string | null;

  /** Para pausar a alguien sin borrarlo. */
  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
