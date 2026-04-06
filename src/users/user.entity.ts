import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { hash } from 'bcrypt';
import { Customer } from '../customers/entity/customer.entity';
import { Rol } from '../roles/rol.entity';
import { Sucursales } from '../sucursales/entities/sucursale.entity';
import { LeadNote } from '../lead-notes/entities/lead-note.entity';
import { CalendarEvent } from '../calendar-event/entities/calendar-event.entity';
import { Task } from '../task/entities/task.entity';
import { Client } from '../clients/entities/client.entity';
import { Permission } from '../permission/entities/permission.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  lastname: string;

  @Column({ unique: true })
  email: string;

  @Column({ default: false })
  isDelete: boolean;

  @Column()
  puesto: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  image: string;

  @OneToMany(() => Client, (client) => client.user)
  clients: Client[];

  @JoinTable({
    name: 'user_has_roles',
    joinColumn: {
      name: 'id_user',
    },
    inverseJoinColumn: {
      name: 'id_rol',
    },
  })
  @ManyToMany(() => Rol, (rol) => rol.users)
  roles: Rol[];

  @ManyToMany(() => Sucursales, (sucursal) => sucursal.usuarios)
  sucursales: Sucursales[];

  @ManyToMany(() => Client, (client) => client.users)
  @JoinTable({
    name: 'users_have_clients', // Nombre de la tabla intermedia
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'client_id', referencedColumnName: 'id' },
  })
  assignedClients: Client[];
  
  @Column()
  password: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  // 🔁 Relación con las notas tipo chat
  @OneToMany(() => LeadNote, (note) => note.author)
  notes: LeadNote[];

  @BeforeInsert()
  async hashPassword() {
    this.password = await hash(this.password, Number(process.env.HAST_SALT));
  }
  @OneToMany(() => Customer, (customer) => customer.user)
  customers: Customer[];

  @OneToMany(() => Task, (task) => task.user)
  tasks: Task[];

  @Column()
  refreshToken: string;

  @OneToMany(() => CalendarEvent, (activity) => activity.createdBy)
  events: CalendarEvent[];

  @Column({ default: '' })
  wallet: string;

  @ManyToMany(() => CalendarEvent, (event) => event.participants)
  participatingEvents: CalendarEvent[];

  @ManyToMany(() => Permission)
  @JoinTable({
    name: 'user_has_permissions',
    joinColumn: { name: 'id_user' },
    inverseJoinColumn: { name: 'id_permission' },
  })
  permissions: Permission[];
}
