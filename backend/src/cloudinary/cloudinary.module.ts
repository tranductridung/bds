import { CloudinaryProvider } from './cloudinary.provider';
import { Module } from '@nestjs/common';

@Module({
  providers: [CloudinaryProvider],
  exports: [CloudinaryProvider],
})
export class CloudinaryModule {}
