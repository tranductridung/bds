import {
  Req,
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
  Body,
} from '@nestjs/common';
import {
  AuditLogAction,
  AuditLogTargetType,
} from '@/src/log/enums/audit-log.enum';
import * as multer from 'multer';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuditLog } from '@/src/log/decorators/audit.decorator';
import { PropertyImageService } from './property-image.service';
import { PaginationDto } from '@/src/common/dtos/pagination.dto';
import { AuthJwtGuard } from '@/src/authentication/guards/auth.guard';
import { PropertyAccessGuard } from '../guards/property-access.guard';
import { ResponseService } from '@/src/common/helpers/response.service';
import { PermissionsGuard } from '@/src/authorization/guards/permission.guard';
import { SystemUserGuard } from '@/src/authorization/guards/system-user.guard';
import { RequirePermissions } from '@/src/authentication/decorators/permissions.decorator';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ApiErrorsOld } from '@/src/common/decorators/error-response.decorator';

@ApiTags('Property Images')
@ApiBearerAuth('access-token')
@UseGuards(AuthJwtGuard, PermissionsGuard)
@Controller('images')
export class ImageController {
  constructor(private readonly imageService: PropertyImageService) {}

  @RequirePermissions('property:image:read')
  @UseGuards(SystemUserGuard)
  @ApiOperation({ summary: 'List all property images with pagination' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiOkResponse({ description: 'Images retrieved successfully' })
  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const { images, total } = await this.imageService.findAll(paginationDto);
    return ResponseService.format(images, { total });
  }
}

@ApiTags('Property Images Management')
@ApiBearerAuth('access-token')
@UseGuards(AuthJwtGuard, PermissionsGuard, PropertyAccessGuard)
@Controller('properties/:propertyId/images')
export class PropertyImageController {
  constructor(private readonly imageService: PropertyImageService) {}

  @RequirePermissions('property:image:create')
  @ApiOperation({ summary: 'Upload an image for a property' })
  @ApiParam({ name: 'propertyId', description: 'Property ID', type: 'number' })
  @ApiOkResponse({ description: 'Image uploaded successfully' })
  @ApiErrorsOld(400, 404)
  @Post()
  @AuditLog({
    action: AuditLogAction.CREATE,
    targetType: AuditLogTargetType.PROPERTY_IMAGE,
  })
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
    @Req() req: Request,
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Body('filename') filename: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const image = await this.imageService.upload(
      propertyId,
      file,
      Number(req?.user?.id),
      req?.requestContext,
      filename,
    );

    req.auditPayload = {
      targetId: image.id,
      newValue: {
        filename: image.filename,
        size: image.size,
        propertyId: image.propertyId,
      },
      description: `Create image ${image.id}`,
    };

    return image;
  }

  @RequirePermissions('property:image:delete')
  @ApiOperation({ summary: 'Delete a property image' })
  @ApiParam({ name: 'propertyId', description: 'Property ID', type: 'number' })
  @ApiParam({ name: 'imageId', description: 'Image ID', type: 'number' })
  @ApiOkResponse({ description: 'Image deleted successfully' })
  @ApiErrorsOld(404)
  @AuditLog({
    action: AuditLogAction.DELETE,
    targetType: AuditLogTargetType.PROPERTY_IMAGE,
  })
  @Delete(':imageId')
  async removeImage(
    @Req() req: Request,
    @Param('imageId', ParseIntPipe) imageId: number,
    @Param('propertyId', ParseIntPipe) propertyId: number,
  ) {
    const { oldValue } = await this.imageService.remove(propertyId, imageId);

    req.auditPayload = {
      targetId: imageId,
      oldValue,
      description: `Remove rating #${imageId}} of property #${propertyId}`,
    };

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
