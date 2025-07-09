import { Department } from "src/departments/entities/department.entity";
import { Ticket } from "src/ticket/entities/ticket.entity";
import { User } from "src/users/user.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity( 'client')
export class Client {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  numberOfClient: string;

  @Column()
  razonSocial: string;

  @Column()
  sucursalId: number;

  @Column('simple-json', { nullable: true })
  correoElectronicos: string[];

  @OneToMany(() => Department, (departamento) => departamento.cliente)
  departamentos: Department[];

  @OneToMany(() => Ticket, (ticket) => ticket.cliente)
  tickets: Ticket[];

   @ManyToOne(() => User, (user) => user.clients, {
    nullable: true,
    onDelete: 'SET NULL', // Si se borra el usuario, no borra al cliente, solo pone null
  })
  user?: User;
}
