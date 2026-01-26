import {
  Entity,
  Unique,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import { Feature } from './feature.entity';
import { Property } from '../../property/entities/property.entity';

@Entity('properties_features')
@Unique(['feature', 'property'])
export class PropertyFeature {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ select: false })
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @Column()
  featureId: number;

  @Column()
  propertyId: number;

  @ManyToOne(() => Feature, (feature) => feature.propertiesFeatures, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'featureId' })
  feature: Feature;

  @ManyToOne(() => Property, (property) => property.propertiesFeatures, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'propertyId' })
  property: Property;
}
