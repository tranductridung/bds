import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeatureService } from './feature.service';
import { Feature } from './entities/feature.entity';
import { FeatureController } from './feature.controller';
import { PropertyFeature } from './entities/property-features.entity';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AuditLogModule } from '../log/audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PropertyFeature, Feature]),
    AuthorizationModule,
    AuditLogModule,
  ],
  controllers: [FeatureController],
  providers: [FeatureService],
  exports: [FeatureService],
})
export class FeatureModule {}
