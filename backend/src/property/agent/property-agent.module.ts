import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '@/src/user/user.module';
import { PropertyAgentService } from './property-agent.service';
import { PropertyAgent } from '../entities/property-agents.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PropertyAgent]), UserModule],
  providers: [PropertyAgentService],
  exports: [PropertyAgentService],
})
export class PropertyAgentModule {}
