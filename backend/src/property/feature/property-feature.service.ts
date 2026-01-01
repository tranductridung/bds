import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from '@/src/common/dtos/pagination.dto';
import { PropertyFeature } from '@/src/feature/entities/property-features.entity';
import { FeatureService } from '@/src/feature/feature.service';

@Injectable()
export class PropertyFeatureService {
  constructor(
    @InjectRepository(PropertyFeature)
    private readonly propertyFeatureRepo: Repository<PropertyFeature>,
    private readonly featureService: FeatureService,
  ) {}
  async addFeatureToProperty(propertyId: number, featureId: number) {
    const feature = await this.featureService.findOne(featureId);

    const existed = await this.propertyFeatureRepo.exists({
      where: {
        feature: { id: featureId },
        property: { id: propertyId },
      },
    });

    if (existed)
      throw new ConflictException('Feature already added to property');

    const propertyFeature = this.propertyFeatureRepo.create({
      feature,
      property: { id: propertyId },
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
    await this.featureService.findOne(featureId);

    const propertyFeature = await this.propertyFeatureRepo.findOne({
      where: {
        feature: { id: featureId },
        property: { id: propertyId },
      },
    });

    if (!propertyFeature)
      throw new NotFoundException('Feature has not been added to property');

    await this.propertyFeatureRepo.remove(propertyFeature);

    return propertyFeature;
  }
}
