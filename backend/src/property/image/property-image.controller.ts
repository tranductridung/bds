import {
  Get,
  Post,
  Param,
  Query,
  Delete,
  UseGuards,
  Controller,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import * as multer from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { PropertyImageService } from './property-image.service';
import { PaginationDto } from '@/src/common/dtos/pagination.dto';
import { AuthJwtGuard } from '@/src/authentication/guards/auth.guard';
import { PropertyAccessGuard } from '../guards/property-access.guard';
import { ResponseService } from '@/src/common/helpers/response.service';
import { PermissionsGuard } from '@/src/authorization/guards/permission.guard';
import { SystemUserGuard } from '@/src/authorization/guards/system-user.guard';
import { RequirePermissions } from '@/src/authentication/decorators/permissions.decorator';

@UseGuards(AuthJwtGuard, PermissionsGuard)
@Controller('images')
export class ImageController {
  constructor(private readonly imageService: PropertyImageService) {}

  @RequirePermissions('property:image:read')
  @UseGuards(SystemUserGuard)
  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const { images, total } = await this.imageService.findAll(paginationDto);
    return ResponseService.format(images, { total });
  }
}

@UseGuards(AuthJwtGuard, PermissionsGuard, PropertyAccessGuard)
@Controller('properties/:propertyId/images')
export class PropertyImageController {
  constructor(private readonly imageService: PropertyImageService) {}

  @RequirePermissions('property:image:create')
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('Only image files allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.imageService.upload(propertyId, file);
  }

  @RequirePermissions('property:image:delete')
  @Delete(':imageId')
  async removeImage(
    @Param('imageId', ParseIntPipe) imageId: number,
    @Param('propertyId', ParseIntPipe) propertyId: number,
  ) {
    await this.imageService.remove(propertyId, imageId);

    return ResponseService.format({ message: 'Remove image successfully!' });
  }

  @RequirePermissions('property:image:read')
  @Get()
  async findAllImagesOfProperty(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    const { images, total } = await this.imageService.findImagesOfProperty(
      propertyId,
      paginationDto,
    );
    return ResponseService.format(images, { total });
  }

  @RequirePermissions('property:image:read')
  @Get(':imageId')
  async findOne(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    const image = await this.imageService.findImageOfProperty(
      propertyId,
      imageId,
    );
    return ResponseService.format(image);
  }
}
