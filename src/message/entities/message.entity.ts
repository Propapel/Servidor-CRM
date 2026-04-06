import { Conversation } from "../../conversation/entities/conversation.entity";
import { User } from "../../users/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Conversation, conversation => conversation.messages)
  conversation: Conversation;

  @ManyToOne(() => User,  { eager: true })
  sender: User; // solo admin o ejecutivo

  @Column()
  content: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  sentAt: Date;

  @Column({ default: false })
  isRead: boolean;
}
