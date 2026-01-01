import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyModule } from '../property.module';
import { UserModule } from '@/src/user/user.module';
import { PropertyAgentService } from './property-agent.service';
import { PropertyAgent } from '../entities/property-agents.entity';
import { PropertyAgentController } from './property-agent.controller';
import { AuthorizationModule } from '@/src/authorization/authorization.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PropertyAgent]),
    UserModule,
    AuthorizationModule,
    PropertyModule,
  ],
  controllers: [PropertyAgentController],
  providers: [PropertyAgentService],
  exports: [PropertyAgentService],
})
export class PropertyAgentModule {}
