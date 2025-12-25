import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Lead } from '../core/lead.entity';

@Entity()
export class LeadNote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @CreateDateColumn({ select: false })
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @ManyToOne(() => Lead, (lead) => lead.leadNotes, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'leadId' })
  lead: Lead;
}
