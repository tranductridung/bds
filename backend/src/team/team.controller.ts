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
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { TeamService } from './team.service';
import { MemberRole } from './enums/member-role.enum';
import { UpdateTeamDto } from './dto/update-team.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { AuthJwtGuard } from '../authentication/guards/auth.guard';
import { ResponseService } from '../common/helpers/response.service';
import { PermissionsGuard } from 'src/authorization/guards/permission.guard';
import { RequirePermissions } from '../authentication/decorators/permissions.decorator';

@UseGuards(AuthJwtGuard, PermissionsGuard)
@Controller('teams')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @RequirePermissions('team:create')
  @Post()
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
  async remove(
    @Req() req: Request,
    @Param('teamId', ParseIntPipe) teamId: number,
  ) {
    await this.teamService.remove(teamId, Number(req?.user?.id));
    return ResponseService.format({ message: 'Remove team successfully!' });
  }

  // TEAM MEMBER
  @RequirePermissions('team:member:create')
  @Post(':teamId/members')
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
  @Get(':teamId/members')
  async getMembersOfTeam(@Param('teamId', ParseIntPipe) teamId: number) {
    const members = await this.teamService.getMembersOfTeam(teamId);
    return ResponseService.format(members);
  }

  @RequirePermissions('team:member:delete')
  @Delete(':teamId/members/:memberId')
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
  @Patch(':teamId/members/:memberId/role')
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
