import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import {
  Marca,
  Tecnologia,
  TipoEquipo,
  TipoImpresora,
} from '../enum/itequiment.enum';
import { Department } from '../../departments/entities/department.entity';
import { Ticket } from '../../ticket/entities/ticket.entity';
import { Contador } from '../../contador/entities/contador.entity';

@Entity('itequipment')
export class Itequipment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tonerLevel: string;

  @Column()
  departament: string;

  @Column()
  addressInstallation: string;

  @Column({nullable: true})
  password?: string;
  
  @Column()
  modelo: string;

  @Column({
    type: 'enum',
    enum: TipoEquipo,
  })
  tipoEquipo: TipoEquipo;

  @Column()
  marca: string;

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

  @Column()
  numberPrinter: string;

   // Relación inversa: un equipo tiene muchos contadores
  @OneToMany(() => Contador, (contador) => contador.equipo)
  contadores: Contador[];

}
