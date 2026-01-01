import { Module } from '@nestjs/common';
import { TeamService } from './team.service';
import { Team } from './entities/team.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { TeamController } from './team.controller';
import { TeamMember } from './entities/team-members.entity';
import { AuditLogModule } from '../log/audit-log/audit-log.module';
import { AuthorizationModule } from '../authorization/authorization.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Team, TeamMember]),
    UserModule,
    AuthorizationModule,
    AuditLogModule,
  ],
  controllers: [TeamController],
  providers: [TeamService],
})
export class TeamModule {}
