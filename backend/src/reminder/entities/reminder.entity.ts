import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '@/src/user/entities/user.entity';
import { ReminderProcessStatus, ReminderStatus } from '../enums/reminder.enum';

@Entity()
export class Reminder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ReminderStatus,
    default: ReminderStatus.ACTIVE,
  })
  status: ReminderStatus;

  @Column({
    type: 'enum',
    enum: ReminderProcessStatus,
    default: ReminderProcessStatus.PENDING,
  })
  processStatus: ReminderProcessStatus;

  @Column()
  title: string;

  @Column()
  message: string;

  @Column()
  remindAt: Date;

  @Column({ type: 'varchar', nullable: true })
  jobId: string | null;

  @CreateDateColumn({ select: false })
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @ManyToOne(() => User, (creator) => creator.createdReminders, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @Column()
  creatorId: number;

  @ManyToOne(() => User, (assignee) => assignee.assignedReminders, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'assigneeId' })
  assignee: User;

  @Column()
  assigneeId: number;
}
