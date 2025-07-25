import { License } from 'src/license/entities/license.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // Ej: "Office 365", "Kaspersky"

  @Column()
  vendor: string; // Microsoft, Kaspersky, etc.

  @Column()
  branchId: number;

  @OneToMany(() => License, (license) => license.product)
  licenses: License[];

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
