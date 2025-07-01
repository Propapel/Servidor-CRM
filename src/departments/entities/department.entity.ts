import { Client } from "src/clients/entities/client.entity";
import { Itequipment } from "src/itequipments/entities/itequipment.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('department')
export class Department {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  ubicacion: string;

  @Column()
  encargado: string;

  @ManyToOne(() => Client, (cliente) => cliente.departamentos, { onDelete: 'CASCADE' })
  cliente: Client;

  @OneToMany(() => Itequipment, (equipo) => equipo.departamento)
  equipos: Itequipment[];
}
