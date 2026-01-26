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

  @Column({ type: 'varchar', nullable: true })
  path: string | null;

  @Column({ type: 'varchar', nullable: true })
  method: string | null;

  @Column({ type: 'json', nullable: true })
  meta: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'actorId' })
  actor: User | null;

  @Column()
  actorId: number;
}
