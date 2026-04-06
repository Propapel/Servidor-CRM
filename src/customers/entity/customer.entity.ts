import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  AfterLoad,
  BeforeInsert,
  BeforeUpdate,
  OneToOne,
} from 'typeorm';
import { Opportunity } from '../../oportunity/entity/oportunity.entity';
import { Interaction } from '../../interation/entity/interation.entity';
import { Purchase } from '../../purchase/entity/purchase.entity';
import { Reminder } from '../../remider/entity/remider.entity';
import { User } from '../../users/user.entity';
import { Project } from '../../projects/entities/project.entity';
import { Appointment } from '../../appointment/entities/appointment.entity';
import { Activity } from '../../activity/entities/activity.entity';
import { ManagerReviewStatus } from '../../enums/lead_manager_review';
import { LeadStatus } from '../../enums/lead_status';
import { LeadNote } from '../../lead-notes/entities/lead-note.entity';
import { Conversation } from '../../conversation/entities/conversation.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  customer_id: number;

  @Column()
  company_name: string;

  @Column()
  contact_name: string;

  @Column()
  email: string;

  @Column()
  phone_number: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  progressLead: number;

  @OneToMany(() => Conversation, (conversation) => conversation.customer)
  conversations: Conversation[];

  @Column({
    type: 'enum',
    enum: LeadStatus,
    default: LeadStatus.PROSPECT,
  })
  status: LeadStatus;

  @OneToMany(() => LeadNote, (note) => note.customer)
  notes: LeadNote[];

  @Column({
    type: 'enum',
    enum: ManagerReviewStatus,
    default: ManagerReviewStatus.PENDING,
  })
  managerReviewStatus: ManagerReviewStatus;

  @ManyToOne(() => User, (user) => user.customers, { eager: true })
  user: User;

  @OneToMany(() => Project, (project) => project.customer, { eager: true })
  projects: Project[];

  @Column({ nullable: true })
  address: string;

  @Column()
  type_of_client: string;

  @OneToMany(() => Opportunity, (opportunity) => opportunity.customer)
  opportunities: Opportunity[];

  @OneToMany(() => Interaction, (interaction) => interaction.customer)
  interactions: Interaction[];

  @OneToMany(() => Purchase, (purchase) => purchase.customer)
  purchases: Purchase[];

  @OneToMany(() => Reminder, (reminder) => reminder.customer, { eager: true })
  reminders: Reminder[];

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  // Relación con las actividades del cliente
  @OneToMany(() => Activity, (activity) => activity.customer) // Relación inversa con Activity
  activities: Activity[];

  /**
   * Método explícito para calcular el progreso.
   *  const funnelData = {
      prospectos: customers.length,
      contactados: customers.filter(
        (c) => c.progressLead == 25,
      ).length,
      interesados: customers.filter(
        (c) => c.progressLead == 40 || c.progressLead == 60,
      ).length,
      negociacion: customers.filter((c) =>
       c.progressLead == 90, //c.projects.some((p) => p.status === 'En negociacion'),
      ).length,
      cerrados: customers.filter(
        (c) =>
          c.progressLead == 100,
      ).length,
    };

   */

  @BeforeInsert()
  @BeforeUpdate()
  updateProgress() {
    if (this.user) {
      // Asegúrate que 'user' no sea undefined
      this.calculateProgress(this.user.id);
    }
  }

  calculateProgress(userId: number) {
    if (userId === this.user.id) {
      let progress = 10.0;
      let detectedStatus = LeadStatus.PROSPECT;

      if (this.reminders && this.reminders.length > 0) {
        detectedStatus = LeadStatus.CONTACTED;
        progress += 15.0;
      }

      if (this.purchases && this.purchases.length > 0) {
        detectedStatus = LeadStatus.INTERESTED;
        progress += 15.0;
      }

      if (this.projects && this.projects.length > 0) {
        let hasCierre = false;
        let allPerdido = true;

        this.projects.forEach((project) => {
          if (project.status === 'Cierre') {
            hasCierre = true;
          } else if (project.status !== 'Perdido') {
            allPerdido = false;
          }
        });

        if (hasCierre) {
          detectedStatus = LeadStatus.CLIENT;
          progress = 100.0;
        } else if (allPerdido) {
          detectedStatus = LeadStatus.NEGOTIATION;
          progress = 40.0;
        } else {
          const hasNegotiation = this.projects.some(
            (project) => project.status === 'En negociacion',
          );

          if (hasNegotiation) {
            detectedStatus = LeadStatus.NEGOTIATION;
            progress = 90.0;
          }
        }
      }

      this.status = detectedStatus;
      this.progressLead = Math.min(progress, 100.0);
    }
  }
}
