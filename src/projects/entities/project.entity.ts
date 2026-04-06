import { Customer } from "../../customers/entity/customer.entity";
import { Purchase } from "../../purchase/entity/purchase.entity";
import { Column, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ProjectCancellation } from "./projectCancellation.entity";

@Entity({ name: 'project' })
export class Project {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nameProject: string;
    

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0.0 })
    valorProject: number;
    
    @Column()
    progress: number;

    @ManyToOne(() => Customer, customer => customer.projects, { onDelete: 'CASCADE' ,})
    customer: Customer;

    @Column()
    status: string;

    @Column()
    prioridad: string;

    @OneToMany(() => Purchase,(purchase) => purchase.project)
    products: Purchase[];

    @OneToMany(() => ProjectCancellation, (cancellation) => cancellation.project)
    cancellations: ProjectCancellation[];  // Relación con la tabla auxiliar

    @Column({ default: false })
    isCancel: boolean;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;
    
    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    updated_at: Date;
    

}
