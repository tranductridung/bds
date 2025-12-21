import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyModule } from '../property.module';
import { AuthorizationModule } from '@/src/authorization/authorization.module';
import { RatingController } from './rating.controller';
import { Rating } from '../entities/ratings.entity';
import { RatingService } from './rating.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rating]),
    forwardRef(() => PropertyModule),
    AuthorizationModule,
  ],
  providers: [RatingService],
  exports: [RatingService],
  controllers: [RatingController],
})
export class RatingModule {}
