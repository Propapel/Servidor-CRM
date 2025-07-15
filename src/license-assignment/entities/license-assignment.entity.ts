import { Client } from "src/clients/entities/client.entity";
import { License } from "src/license/entities/license.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('license_assignments')
export class LicenseAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Client, (client) => client.assignments)
  client: Client;

  @ManyToOne(() => License, (license) => license.assignments)
  license: License;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  assignedAt: Date;

  @Column({ nullable: true })
  returnedAt: Date;
}
