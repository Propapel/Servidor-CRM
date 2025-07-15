import { LicenseAssignment } from "src/license-assignment/entities/license-assignment.entity";
import { Product } from "src/product/entities/product.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('licenses')
export class License{
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  key: string;

  @Column()
  expirationDate: Date;

  @ManyToOne(() => Product, (product) => product.licenses)
  product: Product;

  @OneToMany(() => LicenseAssignment, (assignment) => assignment.license)
  assignments: LicenseAssignment[];

  @Column({ default: true })
  available: boolean;
}
