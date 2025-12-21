import {
  Column,
  Entity,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  PropertySystemStatus,
  PropertyBusinessStatus,
} from '../enums/property.enum';
import { Rating } from './ratings.entity';
import { PropertyAgent } from './property-agents.entity';
import { PropertyImage } from './property-images.entity';
import { PropertyFeature } from '@/src/feature/entities/property-features.entity';
import { ColumnNumericTransformer } from '@/src/common/transformers/column-numeric.transformer';

@Entity()
export class Property {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('decimal', {
    precision: 15,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
    nullable: true,
  })
  price: number;

  @Column()
  type: string;

  @Column('decimal', {
    precision: 10,
    scale: 6,
    transformer: new ColumnNumericTransformer(),
    nullable: true,
  })
  latitude: number;

  @Column('decimal', {
    precision: 10,
    scale: 6,
    transformer: new ColumnNumericTransformer(),
    nullable: true,
  })
  longitude: number;

  @Column({ nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: PropertyBusinessStatus,
    default: PropertyBusinessStatus.AVAILABLE,
  })
  businessStatus: PropertyBusinessStatus;

  @Column({
    type: 'enum',
    enum: PropertySystemStatus,
    default: PropertySystemStatus.DRAFT,
  })
  systemStatus: PropertySystemStatus;

  @CreateDateColumn({ select: false })
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @OneToMany(() => PropertyFeature, (pf) => pf.property)
  propertiesFeatures: PropertyFeature[];

  @OneToMany(() => PropertyAgent, (pa) => pa.property)
  propertiesAgents: PropertyAgent[];

  @OneToMany(() => Rating, (pr) => pr.property)
  ratings: Rating[];

  @OneToMany(() => PropertyImage, (pr) => pr.property)
  propertyImages: PropertyImage[];
}
