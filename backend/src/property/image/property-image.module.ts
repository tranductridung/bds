import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyImageService } from './property-image.service';
import { PropertyImage } from '../entities/property-images.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PropertyImage])],
  providers: [PropertyImageService],
})
export class PropertyImageModule {}
