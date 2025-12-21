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
import { Property } from '../entities/property.entity';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { UpdateRatingDto } from '../dto/rating/update-rating.dto';
import { CreateRatingDto } from '../dto/rating/create-rating.dto';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepo: Repository<Rating>,
    @Inject(forwardRef(() => PropertyService))
    private readonly propertyService: PropertyService,
  ) {}

  async create(property: Property, createRatingDto: CreateRatingDto) {
    const rating = this.ratingRepo.create({
      ...createRatingDto,
      property,
    });

    await this.ratingRepo.save(rating);
    return rating;
  }

  async findAll(paginationDto?: PaginationDto) {
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

  async findOne(ratingId: number) {
    const rating = await this.ratingRepo.findOne({
      where: { id: ratingId },
    });

    if (!rating) throw new NotFoundException('Rating not found!');

    return rating;
  }

  async update(ratingId: number, updateRatingDto: UpdateRatingDto) {
    const rating = await this.ratingRepo.findOne({
      where: { id: ratingId },
      relations: ['property'],
    });

    if (!rating) throw new NotFoundException('Rating not found!');

    const updatedRating = this.ratingRepo.merge(rating, updateRatingDto);

    await this.ratingRepo.save(updatedRating);

    return updatedRating;
  }

  async remove(ratingId: number) {
    const rating = await this.ratingRepo.findOne({
      where: { id: ratingId },
      relations: ['property'],
    });

    if (!rating) throw new NotFoundException('Rating not found!');

    await this.ratingRepo.remove(rating);
  }

  // PROPERTY RATING
  async findRatingsOfProperty(
    propertyId: number,
    paginationDto?: PaginationDto,
  ) {
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
