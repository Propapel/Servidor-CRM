import { Department } from "../../departments/entities/department.entity";
import { EquipmentReplacement } from "../../equipment-replacement/entities/equipment-replacement.entity";
import { LicenseAssignment } from "../../license-assignment/entities/license-assignment.entity";
import { Ticket } from "../../ticket/entities/ticket.entity";
import { User } from "../../users/user.entity";
import { Column, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity( 'client')
export class Client {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  numberOfClient: string;

  @Column()
  codeClient: string;
  
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

   @OneToMany(() => EquipmentReplacement, (equipmentReplacements) => equipmentReplacements.client)
  equipmentReplacements: EquipmentReplacement[];

  @ManyToMany(() => User, (user) => user.assignedClients)
  users: User[];

}
