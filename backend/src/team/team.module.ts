import { Module } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { TeamMember } from './entities/team-members.entity';
import { UserModule } from '../user/user.module';
import { AuthorizationModule } from '../authorization/authorization.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Team, TeamMember]),
    UserModule,
    AuthorizationModule,
  ],
  controllers: [TeamController],
  providers: [TeamService],
})
export class TeamModule {}
