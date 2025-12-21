import {
  Entity,
  Unique,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Property } from './property.entity';
import { User } from '@/src/user/entities/user.entity';

@Entity('properties_agents')
@Unique(['agent', 'property'])
export class PropertyAgent {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (agent) => agent.propertiesAgents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'agentId' })
  agent: User;

  @ManyToOne(() => Property, (property) => property.propertiesAgents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
