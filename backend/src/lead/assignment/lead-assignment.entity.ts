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
import { User } from '@/src/user/entities/user.entity';

@Entity()
export class LeadAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  isPrimary: boolean;

  @CreateDateColumn({ select: false })
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @ManyToOne(() => Lead, (lead) => lead.leadAssignments, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'leadId' })
  lead: Lead;

  @ManyToOne(() => User, (user) => user.leadAssignments, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'agentId' })
  agent: User;

  @Column()
  leadId: number;

  @Column()
  agentId: number;
}
