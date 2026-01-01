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
import { buildDiff } from '../common/helpers/build-diff.helper';
import { normalizeFeatureName } from './helpers/normalize-name.helper';

@Injectable()
export class FeatureService {
  constructor(
    @InjectRepository(Feature)
    private readonly featureRepo: Repository<Feature>,
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
    const oldFeature = structuredClone(feature);

    if (updateFeatureDto.name) {
      feature.name = updateFeatureDto.name.trim();
      feature.normalizedName = normalizeFeatureName(updateFeatureDto.name);
    }

    try {
      await this.featureRepo.save(feature);
      const { oldValue, newValue } = buildDiff(oldFeature, feature);
      return { feature, oldValue, newValue };
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY' || err.code === '23505')
        throw new ConflictException('Feature name already exists');

      throw err;
    }
  }

  async remove(featureId: number) {
    const feature = await this.findOne(featureId);

    await this.featureRepo.remove(feature);
    const oldValue = { name: feature.name.slice(0, 50) };
    return { oldValue };
  }
}
