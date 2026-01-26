import {
  Entity,
  Unique,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { Role } from './role.entity';
import { User } from '@/src/user/entities/user.entity';

@Entity('users_roles')
@Unique(['role', 'user'])
export class UserRole {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  roleId: number;

  @Column()
  userId: number;

  @ManyToOne(() => Role, (role) => role.userRoles, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @ManyToOne(() => User, (user) => user.userRoles, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'userId' })
  user: User;
}
