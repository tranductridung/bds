import {
  Column,
  Unique,
  Entity,
  OneToMany,
  BeforeUpdate,
  BeforeInsert,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RolePermission } from './role-permission.entity';

@Entity()
@Unique(['resource', 'action'])
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  action: string;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeAction() {
    this.action = this.action.toLowerCase();
  }

  @Column()
  resource: string;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeResource() {
    if (this.resource) {
      this.resource = this.resource.toLowerCase();
    }
  }

  @Column()
  key: string;

  @CreateDateColumn({ select: false })
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @OneToMany(() => RolePermission, (rp) => rp.permission)
  rolePermissions: RolePermission[];
}
