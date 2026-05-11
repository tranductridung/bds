import {
  SystemLogAction,
  SystemLogActorType,
  SystemLogTargetType,
} from '@/src/log/enums/system-log.enum';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateImageDto } from '../dto/image/create-image.dto';
import { PaginationDto } from '@/src/common/dtos/pagination.dto';
import { v2 as Cloudinary, UploadApiResponse } from 'cloudinary';
import { PropertyImage } from '../entities/property-images.entity';
import { RequestContext } from '@/src/common/types/request-context.interface';
import { SystemLogEvents } from '@/src/log/system-log/events/system-log.event';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ListenerSystemLogPayload } from '@/src/log/system-log/events/system-log-events.payload';

@Injectable()
export class PropertyImageService {
  private readonly logger = new Logger(PropertyImageService.name);
  constructor(
    private eventEmitter: EventEmitter2,
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
    filename?: string,
  ) {
    const image: CreateImageDto = this.imageRepo.create({
      propertyId,
      filename: filename ?? null,
      url: result.secure_url,
      originalName: file.originalname,
      publicId: result.public_id,
      mimeType: file.mimetype,
      size: file.size,
      width: result.width,
      height: result.height,
    });

    return this.imageRepo.save(image);
  }

  async upload(
    propertyId: number,
    file: Express.Multer.File,
    actorId: number,
    requestCtx: RequestContext,
    filename?: string,
  ) {
    let uploadResult: UploadApiResponse | null = null;

    try {
      uploadResult = await this.uploadToCloudinary(file);
      return await this.create(propertyId, uploadResult, file, filename);
    } catch (error) {
      this.logger.error('Upload image failed', error);

      // rollback if uploaded to cloudinary but save DB fail
      if (uploadResult?.public_id) {
        await this.cloudinary.uploader.destroy(uploadResult.public_id, {
          resource_type: 'image',
          invalidate: true,
        });
      }

      this.eventEmitter.emit(SystemLogEvents.FILE_UPLOAD_FAILED, {
        action: SystemLogAction.FILE_OPERATION_FAILED,
        actorId,
        actorType: SystemLogActorType.USER,
        targetType: SystemLogTargetType.FILE,
        targetId: propertyId.toString(),
        path: requestCtx.path,
        method: requestCtx.method,
        statusCode: requestCtx.statusCode,
      } satisfies ListenerSystemLogPayload);

      this.logger.error(error);

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
        select: { id: true, publicId: true },
      });

      if (!image) throw new NotFoundException('Image not found!');

      await this.cloudinary.uploader.destroy(image.publicId, {
        resource_type: 'image',
        invalidate: true,
      });

      await this.imageRepo.remove(image);

      const oldValue = {
        filename: image.filename,
        size: image.size,
        propertyId: image.propertyId,
      };

      return { oldValue };
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
