import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('renta')
export class Renta {
    @PrimaryGeneratedColumn()
    id: number;

     @Column({ type: 'datetime', nullable: true })
    inicioRenta: Date;

     @Column({ type: 'datetime', nullable: true })
    finRenta: Date;

    @Column()
    planRenta: string;

    @Column()
    precioMonocromatico:  string;

    @Column()
    createAt: Date;

    @Column()
    updateAt: Date;

}
