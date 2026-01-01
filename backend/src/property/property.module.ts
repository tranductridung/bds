import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { PropertyService } from './property.service';
import { Property } from './entities/property.entity';
import { PropertyController } from './property.controller';
import { PropertyAccessService } from './property-access.service';
import { PropertyAccessGuard } from './guards/property-access.guard';
import { AuthorizationModule } from '../authorization/authorization.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Property]),
    AuthorizationModule,
    UserModule,
  ],
  controllers: [PropertyController],
  providers: [PropertyService, PropertyAccessService, PropertyAccessGuard],
  exports: [PropertyService, PropertyAccessService, PropertyAccessGuard],
})
export class PropertyModule {}
