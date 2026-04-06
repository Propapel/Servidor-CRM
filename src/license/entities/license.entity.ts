import { Client } from '../../clients/entities/client.entity';
import { LicenseAssignment } from '../../license-assignment/entities/license-assignment.entity';
import { Product } from '../../product/entities/product.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('licenses')
export class License {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  key: string;

  @Column(
    {
      nullable: true,
    }
  )
  expirationDate?: Date;

  @Column(
    { 
      nullable: true
    }
  )
  codeSerie: string;

  @Column({
    nullable: true,
  })
  departamentAssign?: string;

  @Column({
    nullable: true,
  })
  email?: string;

  @Column({
    nullable: true,
  })
  password?: string;

  @Column({ type: 'datetime', nullable: true })
  dateAssigment?: Date;

  @ManyToOne(() => Product, (product) => product.licenses)
  product: Product;

  @ManyToOne(() => Client)
  client: Client;

  @Column({ default: true })
  available: boolean;
}
