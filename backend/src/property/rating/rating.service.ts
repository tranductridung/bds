import {
  Inject,
  Injectable,
  forwardRef,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Rating } from '../entities/ratings.entity';
import { PropertyService } from '../property.service';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { UpdateRatingDto } from '../dto/rating/update-rating.dto';
import { CreateRatingDto } from '../dto/rating/create-rating.dto';
import { buildDiff } from '@/src/common/helpers/build-diff.helper';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepo: Repository<Rating>,
    @Inject(forwardRef(() => PropertyService))
    private readonly propertyService: PropertyService,
  ) {}

  async create(
    propertyId: number,
    createRatingDto: CreateRatingDto,
  ): Promise<Rating> {
    const rating = this.ratingRepo.create({
      ...createRatingDto,
      property: { id: propertyId },
    });

    await this.ratingRepo.save(rating);
    return rating;
  }

  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<{ ratings: Rating[]; total: number }> {
    const queryBuilder = this.ratingRepo
      .createQueryBuilder('pr')
      .addSelect(['pr.createdAt'])
      .orderBy('pr.createdAt', 'DESC');

    if (
      paginationDto?.page !== undefined &&
      paginationDto?.limit !== undefined
    ) {
      const { page, limit } = paginationDto;

      queryBuilder.skip(page * limit).take(limit);
    }

    const [ratings, total] = await queryBuilder.getManyAndCount();

    return { ratings, total };
  }

  async findOne(ratingId: number): Promise<Rating> {
    const rating = await this.ratingRepo.findOne({
      where: { id: ratingId },
    });

    if (!rating) throw new NotFoundException('Rating not found!');

    return rating;
  }

  async update(
    propertyId: number,
    ratingId: number,
    updateRatingDto: UpdateRatingDto,
  ) {
    const rating = await this.ratingRepo.findOne({
      where: { id: ratingId, property: { id: propertyId } },
      relations: ['property'],
    });

    if (!rating) throw new NotFoundException('Rating not found!');

    const oldRating = structuredClone(rating);

    this.ratingRepo.merge(rating, updateRatingDto);

    await this.ratingRepo.save(rating);

    const { oldValue, newValue } = buildDiff(oldRating, rating);

    return { oldValue, newValue, rating };
  }

  async remove(propertyId: number, ratingId: number) {
    const rating = await this.ratingRepo.findOne({
      where: { id: ratingId, property: { id: propertyId } },
    });

    if (!rating) throw new NotFoundException('Rating not found!');

    await this.ratingRepo.remove(rating);

    const oldValue = {
      rating: rating.rating,
      comment: rating.comment?.slice(0, 50),
    };
    return { oldValue };
  }

  // PROPERTY RATING
  async findRatingsOfProperty(
    propertyId: number,
    paginationDto?: PaginationDto,
  ): Promise<{ ratings: Rating[]; total: number }> {
    const queryBuilder = this.ratingRepo
      .createQueryBuilder('pr')
      .innerJoin('pr.property', 'property')
      .where('property.id = :propertyId', { propertyId })
      .addSelect(['pr.createdAt'])
      .orderBy('pr.createdAt', 'DESC');

    if (
      paginationDto?.page !== undefined &&
      paginationDto?.limit !== undefined
    ) {
      const { page, limit } = paginationDto;

      queryBuilder.skip(page * limit).take(limit);
    }

    const [ratings, total] = await queryBuilder.getManyAndCount();
    return { ratings, total };
  }
}
