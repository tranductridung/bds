import {
  Column,
  Entity,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IsEnum } from 'class-validator';
import { UserStatus, Gender } from '../enums/user.enum';
import { Reminder } from '@/src/reminder/entities/reminder.entity';
import { UserRole } from 'src/authorization/entities/user-role.entity';
import { AuditLog } from '@/src/log/audit-log/entities/audit-log.entity';
import { SystemLog } from '@/src/log/system-log/entities/system-log.entity';
import { LeadAssignment } from '@/src/lead/assignment/lead-assignment.entity';
import { PropertyAgent } from '@/src/property/entities/property-agents.entity';
import { RefreshToken } from '@/src/refresh-token/entities/refresh-token.entity';
import { NotificationReceiver } from '@/src/notification/entities/notifications_receivers.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column()
  fullName!: string;

  @Column({ type: 'varchar', nullable: true })
  phoneNumber!: string | null;

  @Column({ type: 'varchar', nullable: true })
  address!: string | null;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.UNVERIFIED })
  @IsEnum(UserStatus)
  status!: UserStatus;

  @Column({ type: 'varchar', select: false, nullable: true })
  password!: string | null;

  @Column({ type: 'enum', enum: Gender, default: Gender.UNDEFINED })
  gender!: Gender;

  @Column({ type: 'date', nullable: true })
  dob!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'date', nullable: true })
  lastLoginAt!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  lastLoginIp!: string | null;

  @Column({ type: 'date', nullable: true })
  lockUntil!: Date | null;

  @Column({ default: 0 })
  failedLoginAttempts!: number;

  @CreateDateColumn({ select: false })
  createdAt!: Date;

  @UpdateDateColumn({ select: false })
  updatedAt!: Date;

  @OneToMany(() => RefreshToken, (tokens) => tokens.user)
  refreshTokens!: RefreshToken[];

  @OneToMany(() => UserRole, (ur) => ur.user)
  userRoles!: UserRole[];

  @OneToMany(() => PropertyAgent, (pa) => pa.agent)
  propertiesAgents!: PropertyAgent[];

  @OneToMany(() => LeadAssignment, (la) => la.agent)
  leadAssignments!: LeadAssignment[];

  @OneToMany(() => AuditLog, (ad) => ad.actor)
  auditLogs!: AuditLog[];

  @OneToMany(() => SystemLog, (sl) => sl.actor)
  systemLogs!: SystemLog[];

  @OneToMany(() => NotificationReceiver, (un) => un.receiver)
  notificationReceivers!: NotificationReceiver[];

  @OneToMany(() => Reminder, (reminder) => reminder.creator)
  createdReminders!: Reminder[];

  @OneToMany(() => Reminder, (reminder) => reminder.assignee)
  assignedReminders!: Reminder[];
}
