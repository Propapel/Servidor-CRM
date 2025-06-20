import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { TicketAction } from "../enum/ticket_action_enum";
import { Ticket } from "src/ticket/entities/ticket.entity";

@Entity('ticket_update')
export class TicketUpdate {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Ticket, (ticket) => ticket.updates)
  ticket: Ticket;

  @Column({
    type: 'enum',
    enum: TicketAction,
  })
  action: TicketAction;
  // Ej. "Ticket Created", "Assigned to Mark"

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;
}

