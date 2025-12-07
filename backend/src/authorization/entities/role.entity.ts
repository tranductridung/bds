import {
  Entity,
  Column,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserRole } from './user-role.entity';
import { RolePermission } from './role-permission.entity';

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeName() {
    this.name = this.name.toLowerCase();
  }

  @Column({ nullable: true })
  description: string;

  @Column({ default: false })
  isSystem: boolean;

  @CreateDateColumn({ select: false })
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @OneToMany(() => RolePermission, (rp) => rp.role)
  rolePermissions: RolePermission[];

  @OneToMany(() => UserRole, (ur) => ur.role)
  userRoles: UserRole[];
}
