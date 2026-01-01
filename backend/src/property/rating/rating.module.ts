import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingService } from './rating.service';
import { forwardRef, Module } from '@nestjs/common';
import { Rating } from '../entities/ratings.entity';
import { PropertyModule } from '../property.module';
import { RatingController } from './rating.controller';
import { AuditLogModule } from '@/src/log/audit-log/audit-log.module';
import { AuthorizationModule } from '@/src/authorization/authorization.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rating]),
    forwardRef(() => PropertyModule),
    AuthorizationModule,
    AuditLogModule,
  ],
  providers: [RatingService],
  exports: [RatingService],
  controllers: [RatingController],
})
export class RatingModule {}
