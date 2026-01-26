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
import { ActivityValue } from '../types/activity-json.type';
import { LeadActivityAction, LeadActivityResource } from '../enums/lead.enum';

@Entity()
export class LeadActivity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: LeadActivityAction,
  })
  action: LeadActivityAction;

  @Column({
    type: 'enum',
    enum: LeadActivityResource,
  })
  resource: LeadActivityResource;

  @Column()
  resourceId: number;

  @Column({ type: 'json', nullable: true })
  oldValue: ActivityValue | null;

  @Column({ type: 'json', nullable: true })
  newValue: ActivityValue | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ select: false })
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @ManyToOne(() => Lead, (lead) => lead.leadActivities, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'leadId' })
  lead: Lead;

  @ManyToOne(() => User, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'performedById' })
  performedBy: User | null;

  @Column()
  leadId: number;

  @Column()
  performedById: number;
}
