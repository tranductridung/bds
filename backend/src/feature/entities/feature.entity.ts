import {
  Index,
  Column,
  Entity,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PropertyFeature } from './property-features.entity';
import { NormalizeTransformer } from '../transformers/transformer-name.transformer';

@Index(['normalizedName'], { unique: true })
@Entity()
export class Feature {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    transformer: new NormalizeTransformer(),
  })
  normalizedName: string;

  @CreateDateColumn({ select: false })
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @OneToMany(() => PropertyFeature, (pf) => pf.feature)
  propertiesFeatures: PropertyFeature[];
}
