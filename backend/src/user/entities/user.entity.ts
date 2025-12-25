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
import { TeamMember } from '@/src/team/entities/team-members.entity';
import { UserRole } from 'src/authorization/entities/user-role.entity';
import { LeadActivity } from '@/src/lead/activity/lead-activity.entity';
import { LeadAssignment } from '@/src/lead/assignment/lead-assignment.entity';
import { PropertyAgent } from '@/src/property/entities/property-agents.entity';
import { RefreshToken } from '@/src/refresh-token/entities/refresh-token.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  fullName: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.UNVERIFIED })
  @IsEnum(UserStatus)
  status: UserStatus;

  @Column({ select: false, nullable: true })
  password?: string;

  @Column({ type: 'enum', enum: Gender, default: Gender.UNDEFINED })
  gender: Gender;

  @Column({ nullable: true })
  dob: Date;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @Column({ nullable: true })
  lastLoginIp: string;

  @CreateDateColumn({ select: false })
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @OneToMany(() => RefreshToken, (tokens) => tokens.user)
  refreshTokens: RefreshToken[];

  @OneToMany(() => UserRole, (ur) => ur.user)
  userRoles: UserRole[];

  @OneToMany(() => TeamMember, (tm) => tm.member)
  teamMember: TeamMember[];

  @OneToMany(() => PropertyAgent, (pa) => pa.agent)
  propertiesAgents: PropertyAgent[];

  @OneToMany(() => LeadAssignment, (la) => la.agent)
  leadAssignments: LeadAssignment[];

  @OneToMany(() => LeadActivity, (la) => la.performedBy)
  leadActivities: LeadActivity[];
}
