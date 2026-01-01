import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '@/src/user/entities/user.entity';
import { SystemLogLevel } from '../../enums/system-log.enum';

@Entity()
export class SystemLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: SystemLogLevel })
  level: SystemLogLevel;

  @Column()
  event: string;

  @Column({ nullable: true })
  path?: string;

  @Column({ nullable: true })
  method?: string;

  @Column({ type: 'json', nullable: true })
  meta?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actorId' })
  actor?: User;
}
