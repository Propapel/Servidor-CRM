import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum PushPlatform {
  ANDROID = 'android',
  IOS = 'ios',
  DESKTOP = 'desktop',
  WEB = 'web',
}

/** Un equipo que recibe notificaciones push (un usuario puede tener teléfono y escritorio). */
@Entity('push_device')
export class PushDevice {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('IDX_push_device_user')
  @Column()
  userId: number;

  @Index('UQ_push_device_token', { unique: true })
  @Column({ length: 512 })
  token: string;

  @Column({ type: 'enum', enum: PushPlatform })
  platform: PushPlatform;

  @Column({ length: 120, nullable: true })
  deviceName: string | null;

  @Column({ length: 40, nullable: true })
  appVersion: string | null;

  @Column({ type: 'datetime', nullable: true })
  lastSeenAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
