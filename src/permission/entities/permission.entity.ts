import { Rol } from '../../roles/rol.entity';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'permission' })
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string; // Ej: 'help-desk', 'dashboard', 'calendar'

  @Column()
  description: string; // Descripción opcional de la pantalla

  @ManyToMany(() => Rol, (rol) => rol.permissions)
  roles: Rol[];
}
