import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '@/src/user/entities/user.entity';
import { AuditLogAction } from '../../enums/audit-log.enum';
import { ActivityValue } from '@/src/lead/types/activity-json.type';

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: AuditLogAction,
  })
  action: AuditLogAction;

  @Column()
  targetType: string;

  @Column()
  targetId: number;

  @Column({ type: 'json', nullable: true })
  oldValue: ActivityValue | null;

  @Column({ type: 'json', nullable: true })
  newValue: ActivityValue | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', nullable: true })
  ip: string | null;

  @Column({ type: 'varchar', nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ select: false })
  createdAt: Date;

  @ManyToOne(() => User, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'actorId' })
  actor: User;

  @Column()
  actorId: number;
}
