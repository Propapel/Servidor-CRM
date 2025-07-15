export class CreateLicenseDto {
    productId: number;
    // Add other properties as needed, e.g., license key, expiration date, etc.
    key: string;
    expirationDate: Date;
    available: boolean;
}

/*
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

*/