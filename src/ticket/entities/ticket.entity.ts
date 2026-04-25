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
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { TicketUpdate } from '../../ticket-updated/entities/ticket-updated.entity';
import { TicketComment } from '../../ticket-comment/entities/ticket-comment.entity';
import { Client } from '../../clients/entities/client.entity';
import { Itequipment } from '../../itequipments/entities/itequipment.entity';
import { Sucursales } from '../../sucursales/entities/sucursale.entity';
import { TypeOfReportEntity } from '../../type-of-report/entities/type-of-report.entity';
import { TicketStatus } from '../enum/ticiket_report_status';
import { TicketPriority } from '../enum/ticket_priority';
import { TypeOfReport } from '../enum/kind_report';
import { TicketAttentionType } from '../enum/ticket_attention_type';

@Entity('ticket')
export class Ticket {
  @ManyToOne(() => Itequipment, (equipo) => equipo.tickets, {
    nullable: true,
    onDelete: 'SET NULL', // opcional pero recomendable
  })
  equipo: Itequipment;

  @ManyToOne(() => Sucursales, (sucursal) => sucursal.tickets, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  sucursal: Sucursales;

  @Column()
  ticketNumber: string; // consecutivo por sucursal

  @ManyToOne(() => Client, (cliente) => cliente.tickets)
  cliente: Client;

  @Column()
  ticketConsecutive: number;

  @Column({
    default: false,
  })
  isForeign: boolean;

  @Column({
    nullable: true,
  })
  nameCommercial: string;

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: true })
  createdBy: User;

  @Column({ default: false })
  isPublic: boolean;

  @Column()
  nameReported: string;

  @Column()
  apartamentReport: string;

  @Column()
  phoneReport: string;

  @Column()
  emailReport: string;

  @Column({ type: 'text' })
  reasonReport: string;

  @Column({ nullable: true })
  location: string;

  @Column('simple-json', { nullable: true })
  files: string[];

  @Column({ nullable: true })
  pdfPageService: string;

  @Column({ nullable: true })
  imagePageService: string;

  @Column({ nullable: true })
  serviceRating: number;

  @Column({
    default: false,
  })
  isDelete: boolean;

  @Column({ type: 'text', nullable: true })
  serviceComment: string;

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
    enum: TicketAttentionType,
    nullable: true, // o false si es obligatorio
  })
  attentionType: TicketAttentionType;

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

  @Column({ type: 'text', nullable: true })
  reasonPause?: string;

  @Column({
    type: 'enum',
    enum: TypeOfReport,
  })
  typeOfReport: TypeOfReport;

  @ManyToOne(() => TypeOfReportEntity, (type) => type.tickets, {
    nullable: true, // Un ticket siempre debe tener un tipo
    eager: true, // Carga el 'ReportType' automáticamente al buscar un Ticket
  })
  @JoinColumn({ name: 'report_type_id' })
  typeOfReportEntity: TypeOfReportEntity;

  @OneToMany(() => TicketUpdate, (update) => update.ticket, { cascade: true })
  updates: TicketUpdate[];

  @Column({ nullable: true })
  ratingToken?: string;

  @Column({ nullable: true })
  statusToken?: string;

  @Column({ 
    default: false
   })
  isQualifiedTheDifficulty: boolean;

  @Column({ 
    default: 1
   })
  difficultyRating: number;

  @OneToMany(() => TicketComment, (comment) => comment.ticket, {
    cascade: true,
  })
  comments: TicketComment[];

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
