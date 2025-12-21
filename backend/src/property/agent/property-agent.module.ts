import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyAgent } from '../entities/property-agents.entity';
import { PropertyAgentService } from './property-agent.service';
import { UserModule } from '@/src/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([PropertyAgent]), UserModule],
  providers: [PropertyAgentService],
  exports: [PropertyAgentService],
})
export class PropertyAgentModule {}
