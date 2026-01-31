import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyImageService } from './property-image.service';
import { PropertyImage } from '../entities/property-images.entity';
import { CloudinaryModule } from '@/src/cloudinary/cloudinary.module';
import { PropertyImageController } from './property-image.controller';
import { AuthorizationModule } from '@/src/authorization/authorization.module';
import { PropertyModule } from '../property.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PropertyImage]),
    PropertyModule,
    CloudinaryModule,
    AuthorizationModule,
  ],
  providers: [PropertyImageService],
  controllers: [PropertyImageController],
  exports: [PropertyImageService],
})
export class PropertyImageModule {}
