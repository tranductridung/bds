import {
  Entity,
  Unique,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
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

  @ManyToOne(() => Feature, (feature) => feature.propertiesFeatures, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'featureId' })
  feature: Feature;

  @ManyToOne(() => Property, (property) => property.propertiesFeatures, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'propertyId' })
  property: Property;
}
