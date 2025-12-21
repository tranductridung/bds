import { PropertyAccessService } from './property-access.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { forwardRef, Module } from '@nestjs/common';
import { PropertyService } from './property.service';
import { Property } from './entities/property.entity';
import { RatingModule } from './rating/rating.module';
import { FeatureModule } from '../feature/feature.module';
import { PropertyController } from './property.controller';
import { PropertyAgent } from './entities/property-agents.entity';
import { PropertyAgentModule } from './agent/property-agent.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { PropertyAccessGuard } from './guards/property-access.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Property, PropertyAgent]),
    AuthorizationModule,
    PropertyAgentModule,
    UserModule,
    FeatureModule,
    forwardRef(() => RatingModule),
  ],
  controllers: [PropertyController],
  providers: [PropertyService, PropertyAccessService, PropertyAccessGuard],
  exports: [PropertyService, PropertyAccessService, PropertyAccessGuard],
})
export class PropertyModule {}
