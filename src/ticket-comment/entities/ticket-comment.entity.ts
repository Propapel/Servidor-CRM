import { Ticket } from "../../ticket/entities/ticket.entity";
import { User } from "../../users/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('ticket_comment')
export class TicketComment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Ticket, (ticket) => ticket.comments)
  ticket: Ticket;

  @ManyToOne(() => User)
  author: User;

  @Column()
  content: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column()
  imageUrl: string;

  @Column(
    {
      default: true
    }
  )
  isInternal: boolean;
}

