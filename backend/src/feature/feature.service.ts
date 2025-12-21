import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Feature } from './entities/feature.entity';
import { UpdateFeatureDto } from './dto/update-feature.dto';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { Property } from '../property/entities/property.entity';
import { PropertyFeature } from './entities/property-features.entity';
import { normalizeFeatureName } from './helpers/normalize-name.helper';

@Injectable()
export class FeatureService {
  constructor(
    @InjectRepository(Feature)
    private readonly featureRepo: Repository<Feature>,

    @InjectRepository(PropertyFeature)
    private readonly propertyFeatureRepo: Repository<PropertyFeature>,
  ) {}

  async create(createFeatureDto: CreateFeatureDto) {
    const normalizedName = normalizeFeatureName(createFeatureDto.name);

    const existed = await this.featureRepo.exists({
      where: { normalizedName },
    });

    if (existed) throw new ConflictException('Feature name already exists');

    const feature = this.featureRepo.create({
      name: createFeatureDto.name.trim(),
      normalizedName,
    });

    try {
      await this.featureRepo.save(feature);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY' || err.code === '23505')
        throw new ConflictException('Feature name already exists');
      throw err;
    }

    return feature;
  }

  async findAll(paginationDto?: PaginationDto) {
    const queryBuilder = this.featureRepo
      .createQueryBuilder('feature')
      .addSelect(['feature.createdAt'])
      .orderBy('feature.createdAt', 'DESC');

    if (
      paginationDto?.page !== undefined &&
      paginationDto?.limit !== undefined
    ) {
      const { page, limit, search } = paginationDto;

      if (search) {
        queryBuilder.where('LOWER(feature.name) LIKE :search', {
          search: `%${search.toLowerCase()}%`,
        });
      }

      queryBuilder.skip(page * limit).take(limit);
    }
    const [features, total] = await queryBuilder.getManyAndCount();
    return { features, total };
  }

  async findOne(id: number) {
    const feature = await this.featureRepo.findOne({ where: { id } });

    if (!feature) throw new NotFoundException('Feature not found!');

    return feature;
  }

  async update(updateFeatureDto: UpdateFeatureDto, featureId: number) {
    const feature = await this.findOne(featureId);

    if (updateFeatureDto.name) {
      feature.name = updateFeatureDto.name.trim();
      feature.normalizedName = normalizeFeatureName(updateFeatureDto.name);
    }

    try {
      return await this.featureRepo.save(feature);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY' || err.code === '23505')
        throw new ConflictException('Feature name already exists');

      throw err;
    }
  }

  async remove(featureId: number) {
    const feature = await this.findOne(featureId);

    await this.featureRepo.remove(feature);
  }

  // PROPERTY FEATURE
  async addFeatureToProperty(property: Property, featureId: number) {
    const feature = await this.findOne(featureId);

    const existed = await this.propertyFeatureRepo.exists({
      where: {
        feature: { id: featureId },
        property: { id: property.id },
      },
    });

    if (existed)
      throw new ConflictException('Feature already added to property');

    const propertyFeature = this.propertyFeatureRepo.create({
      feature,
      property,
    });

    await this.propertyFeatureRepo.save(propertyFeature);

    return propertyFeature;
  }

  async getFeaturesOfProperty(
    propertyId: number,
    paginationDto?: PaginationDto,
  ) {
    const queryBuilder = this.propertyFeatureRepo
      .createQueryBuilder('pf')
      .innerJoin('pf.property', 'property')
      .innerJoinAndSelect('pf.feature', 'feature')
      .addSelect(['pf.createdAt'])
      .where('property.id = :propertyId', { propertyId })
      .orderBy('pf.createdAt', 'DESC');

    if (
      paginationDto?.page !== undefined &&
      paginationDto?.limit !== undefined
    ) {
      const { page, limit, search } = paginationDto;

      if (search) {
        queryBuilder.andWhere('LOWER(feature.name) LIKE :search', {
          search: `%${search.toLowerCase()}%`,
        });
      }

      queryBuilder.skip(page * limit).take(limit);
    }
    const [features, total] = await queryBuilder.getManyAndCount();

    return { features, total };
  }

  async removeFeatureOfProperty(propertyId: number, featureId: number) {
    // Check if feature exist
    await this.findOne(featureId);

    const propertyFeature = await this.propertyFeatureRepo.findOne({
      where: {
        feature: { id: featureId },
        property: { id: propertyId },
      },
    });

    if (!propertyFeature)
      throw new NotFoundException('Feature has not been added to property');

    await this.propertyFeatureRepo.remove(propertyFeature);
  }
}
