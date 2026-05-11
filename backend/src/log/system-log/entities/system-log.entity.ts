import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '@/src/user/entities/user.entity';
import {
  SystemLogAction,
  SystemLogActorType,
  SystemLogLevel,
  SystemLogTargetType,
} from '../../enums/system-log.enum';
@Entity()
export class SystemLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'enum', enum: SystemLogLevel })
  level!: SystemLogLevel;

  @Column({ type: 'enum', enum: SystemLogAction })
  action!: SystemLogAction;

  @Column({ type: 'varchar', length: 255, nullable: true })
  path!: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  method!: string | null;

  @Column({ type: 'int', nullable: true })
  statusCode!: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'actorId' })
  actor!: User | null;

  @Column({ nullable: true })
  actorId!: number | null;

  @Column({ type: 'enum', enum: SystemLogTargetType })
  targetType!: SystemLogTargetType;

  @Column({ type: 'enum', enum: SystemLogActorType })
  actorType!: SystemLogActorType;

  @Column({ type: 'varchar', nullable: true })
  targetId!: string | null;

  @Column({ type: 'json', nullable: true })
  meta!: Record<string, any> | null;

  @CreateDateColumn()
  createdAt!: Date;
}
