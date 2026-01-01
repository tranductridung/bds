import {
  Get,
  Req,
  Body,
  Post,
  Query,
  Patch,
  Param,
  Delete,
  UseGuards,
  Controller,
  ParseIntPipe,
  ParseEnumPipe,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import {
  AuditLogAction,
  AuditLogTargetType,
} from '../log/enums/audit-log.enum';
import { Request } from 'express';
import { TeamService } from './team.service';
import { MemberRole } from './enums/member-role.enum';
import { UpdateTeamDto } from './dto/update-team.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { AuditLog } from '../log/decorators/audit.decorator';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { AuthJwtGuard } from '../authentication/guards/auth.guard';
import { ResponseService } from '../common/helpers/response.service';
import { PermissionsGuard } from 'src/authorization/guards/permission.guard';
import { AuditInterceptor } from '../log/audit-log/interceptors/audit-log.interceptor';
import { RequirePermissions } from '../authentication/decorators/permissions.decorator';

@UseGuards(AuthJwtGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
@Controller('teams')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @RequirePermissions('team:create')
  @Post()
  @AuditLog({
    action: AuditLogAction.CREATE,
    targetType: AuditLogTargetType.TEAM,
  })
  async create(@Req() req: Request, @Body() createTeamDto: CreateTeamDto) {
    const team = await this.teamService.create(
      createTeamDto,
      Number(req?.user?.id),
    );
    return ResponseService.format(team);
  }

  @RequirePermissions('team:read')
  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const { teams, total } = await this.teamService.findAll(paginationDto);
    return ResponseService.format(teams, { total });
  }

  @RequirePermissions('team:read')
  @Get(':teamId')
  async find(@Param('teamId', ParseIntPipe) teamId: number) {
    const team = await this.teamService.findOne(teamId);
    return ResponseService.format(team);
  }

  @RequirePermissions('team:update')
  @Patch(':teamId')
  @AuditLog({
    action: AuditLogAction.UPDATE,
    targetType: AuditLogTargetType.TEAM,
  })
  async update(
    @Req() req: Request,
    @Body() updateTeamDto: UpdateTeamDto,
    @Param('teamId', ParseIntPipe) teamId: number,
  ) {
    const team = await this.teamService.update(
      updateTeamDto,
      teamId,
      Number(req?.user?.id),
    );
    return ResponseService.format(team);
  }

  @RequirePermissions('team:delete')
  @Delete(':teamId')
  @AuditLog({
    action: AuditLogAction.DELETE,
    targetType: AuditLogTargetType.TEAM,
  })
  async remove(
    @Req() req: Request,
    @Param('teamId', ParseIntPipe) teamId: number,
  ) {
    await this.teamService.remove(teamId, Number(req?.user?.id));
    return ResponseService.format({ message: 'Remove team successfully!' });
  }
}

@UseGuards(AuthJwtGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
@Controller('teams/:teamId/members')
export class TeamMemberController {
  constructor(private readonly teamService: TeamService) {}
  @RequirePermissions('team:member:create')
  @Post()
  @AuditLog({
    action: AuditLogAction.CREATE,
    targetType: AuditLogTargetType.TEAM_MEMBER,
  })
  async addMemberToTeam(
    @Req() req: Request,
    @Param('teamId', ParseIntPipe) teamId: number,
    @Body('memberId', ParseIntPipe) memberId: number,
  ) {
    const teamMember = await this.teamService.addMemberToTeam(
      Number(req?.user?.id),
      teamId,
      memberId,
    );
    return ResponseService.format(teamMember);
  }

  @RequirePermissions('team:member:read')
  @Get()
  async getMembersOfTeam(@Param('teamId', ParseIntPipe) teamId: number) {
    const members = await this.teamService.getMembersOfTeam(teamId);
    return ResponseService.format(members);
  }

  @RequirePermissions('team:member:delete')
  @Delete(':memberId')
  @AuditLog({
    action: AuditLogAction.DELETE,
    targetType: AuditLogTargetType.TEAM_MEMBER,
  })
  async removeMemberFromTeam(
    @Req() req: Request,
    @Param('teamId', ParseIntPipe) teamId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
  ) {
    if (memberId === Number(req?.user?.id)) {
      throw new BadRequestException('Cannot remove yourself from the team');
    }

    await this.teamService.removeMemberFromTeam(
      Number(req?.user?.id),
      teamId,
      memberId,
    );
    return ResponseService.format({
      message: 'Remove member of team successfully!',
    });
  }

  @RequirePermissions('team:member:update')
  @Patch(':memberId/role')
  @AuditLog({
    action: AuditLogAction.CREATE,
    targetType: AuditLogTargetType.TEAM_MEMBER,
  })
  async assignRoleForMember(
    @Req() req: Request,
    @Param('teamId', ParseIntPipe) teamId: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body('role', new ParseEnumPipe(MemberRole)) role: MemberRole,
  ) {
    const currentUserId = Number(req?.user?.id);

    if (currentUserId === memberId) {
      throw new BadRequestException('Cannot change your own role');
    }

    await this.teamService.assignRoleForMember(
      currentUserId,
      teamId,
      memberId,
      role,
    );

    return { message: 'Assign role for member successfully' };
  }
}
