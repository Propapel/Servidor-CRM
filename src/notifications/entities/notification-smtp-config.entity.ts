import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** Servidor de correo (SMTP) y opciones de notificación de una sucursal. */
@Entity('notification_smtp_config')
export class NotificationSmtpConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('UQ_notification_smtp_branch', { unique: true })
  @Column()
  branchId: number;

  /** Cómo se envían los correos: SMTP (usuario/contraseña) o la API HTTPS de Brevo. */
  @Column({ type: 'enum', enum: ['smtp', 'brevo'], default: 'smtp' })
  provider: 'smtp' | 'brevo';

  /** API key de Brevo cifrada con AES-256-GCM; nunca se devuelve al cliente. */
  @Column({ type: 'text', nullable: true, select: false })
  apiKeyEncrypted: string | null;

  /** Si está apagado, la sucursal no envía correos (ni con la cuenta general). */
  @Column({ default: true })
  enabled: boolean;

  @Column({ length: 255 })
  host: string;

  @Column({ default: 587 })
  port: number;

  /** true = TLS directo (puerto 465); false = STARTTLS. */
  @Column({ default: false })
  secure: boolean;

  @Column({ length: 255 })
  username: string;

  /** Contraseña cifrada con AES-256-GCM; nunca se devuelve al cliente. */
  @Column({ type: 'text', nullable: true, select: false })
  passwordEncrypted: string | null;

  @Column({ length: 255 })
  fromEmail: string;

  @Column({ length: 120, default: 'Mesa de ayuda Propapel' })
  fromName: string;

  @Column({ length: 255, nullable: true })
  replyTo: string | null;

  /** Enviar también a quien reportó el ticket (correo capturado en el ticket). */
  @Column({ default: false })
  notifyReporter: boolean;

  /** Enviar al técnico cuando se le asigna un ticket. */
  @Column({ default: true })
  notifyAssignedTechnician: boolean;

  @Column({ type: 'datetime', nullable: true })
  lastTestAt: Date | null;

  @Column({ type: 'boolean', nullable: true })
  lastTestOk: boolean | null;

  @Column({ type: 'text', nullable: true })
  lastTestError: string | null;

  @Column({ nullable: true })
  updatedById: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
