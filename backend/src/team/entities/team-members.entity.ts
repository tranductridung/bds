import {
  Entity,
  Unique,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Team } from './team.entity';
import { User } from '@/src/user/entities/user.entity';
import { MemberRole } from '../enums/member-role.enum';

@Entity('teams_members')
@Unique(['team', 'member'])
export class TeamMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  joinedAt: Date;

  @Column({ type: 'date', nullable: true })
  leftAt: Date | null;

  @Column({ type: 'enum', enum: MemberRole, default: MemberRole.MEMBER })
  role: MemberRole;

  @CreateDateColumn({ select: false })
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @ManyToOne(() => User, (member) => member.teamMember, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'memberId' })
  member: User;

  @ManyToOne(() => Team, (team) => team.teamMember, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'teamId' })
  team: Team;

  @Column()
  teamId: number;

  @Column()
  memberId: number;
}
