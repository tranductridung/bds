import {
  Entity,
  Unique,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { Team } from './team.entity';
import { User } from '@/src/user/entities/user.entity';

@Entity('teams_members')
@Unique(['team', 'user'])
export class TeamMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  joinedAt: Date;

  @Column({ nullable: true })
  leftAt?: Date;

  @ManyToOne(() => User, (user) => user.teamMember, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'memberId' })
  member: User;

  @ManyToOne(() => Team, (team) => team.teamMember, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'teamId' })
  team: Team;
}
