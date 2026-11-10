import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum NotificationLogStatus {
  SENT = 'SENT',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

/** Historial de cada correo de notificación (para auditar qué se envió, a quién y si falló). */
@Entity('notification_log')
@Index('IDX_notification_log_branch', ['branchId', 'createdAt'])
export class NotificationLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  branchId: number | null;

  @Column({ length: 40 })
  event: string;

  @Column({ nullable: true })
  ticketId: number | null;

  @Column({ length: 60, nullable: true })
  ticketNumber: string | null;

  @Column({ type: 'text' })
  recipients: string;

  @Column({ length: 255 })
  subject: string;

  @Column({ type: 'enum', enum: NotificationLogStatus })
  status: NotificationLogStatus;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  /** 'branch' = SMTP de la sucursal, 'default' = cuenta general (variables de entorno). */
  @Column({ length: 20, default: 'branch' })
  smtpSource: string;

  @CreateDateColumn()
  createdAt: Date;
}
