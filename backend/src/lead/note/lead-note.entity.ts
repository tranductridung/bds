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
  id!: number;

  @Column()
  content!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Lead, (lead) => lead.leadNotes, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'leadId' })
  lead!: Lead;

  @Column()
  leadId!: number;
}
