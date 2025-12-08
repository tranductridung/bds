import {
  Column,
  Entity,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IsEnum } from 'class-validator';
import { UserStatus, Gender } from '../../common/enums/enum';
import { UserRole } from 'src/authorization/entities/user-role.entity';
import { RefreshToken } from '@/src/refresh-token/entities/refresh-token.entity';
import { TeamMember } from '@/src/team/entities/team-members.entity';

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
}
