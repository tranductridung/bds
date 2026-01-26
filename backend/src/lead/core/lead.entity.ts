import {
  Column,
  Entity,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LeadStatus } from '../enums/lead.enum';
import { LeadNote } from '../note/lead-note.entity';
import { LeadActivity } from '../activity/lead-activity.entity';
import { LeadAssignment } from '../assignment/lead-assignment.entity';
import { ColumnNumericTransformer } from '@/src/common/transformers/column-numeric.transformer';

@Entity()
export class Lead {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  fullName: string;

  @Column({ type: 'varchar', nullable: true })
  phoneNumber: string | null;

  @Column({ type: 'varchar', nullable: true })
  requirement: string | null;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
    nullable: true,
  })
  budgetMin: number | null;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
    nullable: true,
  })
  budgetMax: number | null;

  @Column({
    type: 'enum',
    enum: LeadStatus,
    default: LeadStatus.NEW,
  })
  status: LeadStatus;

  @CreateDateColumn({ select: false })
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @OneToMany(() => LeadNote, (ln) => ln.lead)
  leadNotes: LeadNote[];

  @OneToMany(() => LeadAssignment, (la) => la.lead)
  leadAssignments: LeadAssignment[];

  @OneToMany(() => LeadActivity, (la) => la.lead)
  leadActivities: LeadActivity[];
}
