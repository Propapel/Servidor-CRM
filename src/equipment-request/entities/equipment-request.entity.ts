/*
@Entity('equipment_requests')
export class EquipmentRequest {
  @PrimaryGeneratedColumn()
  id: number;

  // ===== Datos del cliente =====
  @Column({ type: 'varchar', length: 255 })
  cliente: string;

  @Column({
    type: 'enum',
    enum: SolicitudEtapa,
    default: SolicitudEtapa.SOLICITUD,
  })
  etapa: SolicitudEtapa;

  @Column({
    type: 'enum',
    enum: SolicitudTipo,
    default: SolicitudTipo.IMPRESORA,
  })
  tipo: SolicitudTipo;

  // ===== Datos del producto/servicio solicitado =====
  @Column({ type: 'varchar', length: 255, nullable: true })
  modelo: string; // modelo de equipo o refacción

  @Column({ type: 'varchar', length: 100, nullable: true })
  numeroSerie: string; // aplica si es equipo

  @Column({ type: 'varchar', length: 500, nullable: true })
  detalleProducto: string; // descripción libre (ej. tipo de pieza, proveedor, etc.)

  @Column({ type: 'varchar', length: 100, nullable: true })
  plan: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  precioPorPaginaBn: number; // solo aplica impresoras

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  precioPorPaginaColor: number; // solo aplica impresoras

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  costoEstimado: number; // general para refacciones o compras externas

  // ===== Logística =====
  @Column({ type: 'varchar', length: 500, nullable: true })
  direccionEntrega: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  servicio: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  folioContrato: string;

  // ===== Firma / responsable =====
  @Column({ type: 'varchar', length: 255, nullable: true })
  nombreFirma: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  depto: string;

  // ===== Estado actual =====
  @Column({
    type: 'enum',
    enum: SolicitudEstado,
    default: SolicitudEstado.CAPTURADA,
  })
  estado: SolicitudEstado;

  // ===== Relación opcional a Ticket =====
  @ManyToOne(() => Ticket, (ticket) => ticket.solicitudes, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  // ===== Historial de cambios =====
  @OneToMany(
    () => SolicitudEquipoHistorial,
    (historial) => historial.solicitud,
    {
      cascade: true,
    },
  )
  historial: SolicitudEquipoHistorial[];

  // ===== Auditoría =====
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
*/