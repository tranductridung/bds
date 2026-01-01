import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeatureModule } from '@/src/feature/feature.module';
import { PropertyFeatureService } from './property-feature.service';
import { PropertyFeature } from '@/src/feature/entities/property-features.entity';
import { AuthorizationModule } from '@/src/authorization/authorization.module';
import { AuditLogModule } from '@/src/log/audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PropertyFeature]),
    FeatureModule,
    AuthorizationModule,
    AuditLogModule,
  ],
  providers: [PropertyFeatureService],
  exports: [PropertyFeatureService],
})
export class PropertyFeatureModule {}
