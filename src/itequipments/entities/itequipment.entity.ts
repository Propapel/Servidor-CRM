import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import {
  Marca,
  Tecnologia,
  TipoEquipo,
  TipoImpresora,
} from '../enum/itequiment.enum';
import { Department } from 'src/departments/entities/department.entity';
import { Ticket } from 'src/ticket/entities/ticket.entity';

@Entity('itequipment')
export class Itequipment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({nullable: true})
  password?: string;
  
  @Column()
  modelo: string;

  @Column({
    type: 'enum',
    enum: TipoEquipo,
  })
  tipoEquipo: TipoEquipo;

  @Column({
    type: 'enum',
    enum: Marca,
  })
  marca: Marca;

  // Solo si es impresora
  @Column({
    type: 'enum',
    enum: TipoImpresora,
    nullable: true,
  })
  tipoImpresora?: TipoImpresora;

  @Column({
    type: 'enum',
    enum: Tecnologia,
    nullable: true,
  })
  tecnologia?: Tecnologia;

  @Column({ nullable: true })
  tamanoPapel?: string;

  @ManyToOne(() => Department, (dep) => dep.equipos, { onDelete: 'CASCADE' })
  departamento: Department;

  @OneToMany(() => Ticket, (ticket) => ticket.equipo)
  tickets: Ticket[];

  @Column({ nullable: true })
  serialNumber?: string;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ type: 'boolean', default: false })
  isInNubePrint: boolean;

  @Column({ nullable: true })
  licenseNubePrint?: string;


}
