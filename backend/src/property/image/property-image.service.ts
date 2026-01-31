import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateImageDto } from '../dto/image/create-image.dto';
import { PaginationDto } from '@/src/common/dtos/pagination.dto';
import { v2 as Cloudinary, UploadApiResponse } from 'cloudinary';
import { PropertyImage } from '../entities/property-images.entity';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

@Injectable()
export class PropertyImageService {
  private readonly logger = new Logger(PropertyImageService.name);
  constructor(
    @InjectRepository(PropertyImage)
    private imageRepo: Repository<PropertyImage>,

    @Inject('CLOUDINARY') private cloudinary: typeof Cloudinary,
  ) {}

  private uploadToCloudinary(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const upload = this.cloudinary.uploader.upload_stream(
        {
          folder: 'firsthome-property-images',
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result) {
            return reject(
              error instanceof Error
                ? error
                : new Error(error?.message || 'Upload failed'),
            );
          }
          resolve(result);
        },
      );

      upload.end(file.buffer);
    });
  }

  private async create(
    propertyId: number,
    result: UploadApiResponse,
    file: Express.Multer.File,
  ) {
    const image: CreateImageDto = this.imageRepo.create({
      propertyId,
      url: result.secure_url,
      originalName: result.original_filename ?? file.originalname,
      publicId: result.public_id,
      mimeType: file.mimetype,
      size: file.size,
      width: result.width,
      height: result.height,
    });

    return this.imageRepo.save(image);
  }

  async upload(propertyId: number, file: Express.Multer.File) {
    let uploadResult: UploadApiResponse | null = null;

    try {
      uploadResult = await this.uploadToCloudinary(file);
      return await this.create(propertyId, uploadResult, file);
    } catch (error) {
      this.logger.error('Upload image failed', error);

      // rollback if uploaded to cloudinary but save DB fail
      if (uploadResult?.public_id) {
        await this.cloudinary.uploader.destroy(uploadResult.public_id, {
          resource_type: 'image',
          invalidate: true,
        });
      }

      throw error;
    }
  }

  async findImageOfProperty(propertyId: number, imageId: number) {
    const image = await this.imageRepo.findOne({
      where: { id: imageId, propertyId },
    });

    if (!image) throw new NotFoundException('Image not found!');

    return image;
  }

  async remove(propertyId: number, imageId: number) {
    try {
      const image = await this.imageRepo.findOne({
        where: { id: imageId, propertyId },
        select: ['id', 'publicId'],
      });

      if (!image) throw new NotFoundException('Image not found!');

      await this.cloudinary.uploader.destroy(image.publicId, {
        resource_type: 'image',
        invalidate: true,
      });

      await this.imageRepo.remove(image);
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async findAll(paginationDto?: PaginationDto) {
    const queryBuilder = this.imageRepo
      .createQueryBuilder('image')
      .addSelect(['image.createdAt'])
      .orderBy('image.createdAt', 'DESC');

    if (
      paginationDto?.page !== undefined &&
      paginationDto?.limit !== undefined
    ) {
      const { page, limit, search } = paginationDto;

      if (search) {
        queryBuilder.where('LOWER(image.fileName) LIKE :search', {
          search: `%${search.toLowerCase()}%`,
        });
      }

      queryBuilder.skip(page * limit).take(limit);
    }

    const [images, total] = await queryBuilder.getManyAndCount();

    return { images, total };
  }

  // PROPERTY RATING
  async findImagesOfProperty(
    propertyId: number,
    paginationDto?: PaginationDto,
  ): Promise<{ images: PropertyImage[]; total: number }> {
    const queryBuilder = this.imageRepo
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

    const [images, total] = await queryBuilder.getManyAndCount();
    return { images, total };
  }
}
