import {
  Req,
  Get,
  Body,
  Post,
  Query,
  Patch,
  Param,
  Delete,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { Request } from 'express';
import { TeamService } from './team.service';
import { UpdateTeamDto } from './dto/update-team.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { AuthJwtGuard } from '../authentication/guards/auth.guard';
import { PermissionsGuard } from 'src/authorization/guards/permission.guard';
import { RequirePermissions } from '../authentication/decorators/permissions.decorator';

@UseGuards(AuthJwtGuard, PermissionsGuard)
@Controller('teams')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @RequirePermissions('team:create')
  @Post()
  async create(@Req() req: Request, @Body() createTeamDto: CreateTeamDto) {
    return this.teamService.create(createTeamDto);
  }

  @RequirePermissions('team:read')
  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    return await this.teamService.findAll(paginationDto);
  }

  @RequirePermissions('team:read')
  @Get(':teamId')
  async find(@Param('id') teamId: string) {
    return await this.teamService.findOne(+teamId);
  }

  @RequirePermissions('team:update')
  @Patch(':teamId')
  async update(
    @Body() updateTeamDto: UpdateTeamDto,
    @Param('id') teamId: string,
  ) {
    return this.teamService.update(updateTeamDto, +teamId);
  }

  @RequirePermissions('team:delete')
  @Delete(':teamId')
  async remove(@Param('id') teamId: string) {
    return this.teamService.remove(+teamId);
  }

  @RequirePermissions('team-member:create')
  @Post(':teamId/members')
  async addMemberToTeam(
    @Param('teamId') teamId: string,
    @Body('memberId') memberId: string,
  ) {
    return this.teamService.addMemberToTeam(+teamId, +memberId);
  }

  @RequirePermissions('team-member:read')
  @Get(':teamId/members')
  async getMembersOfTeam(@Param('teamId') teamId: string) {
    return this.teamService.getMembersOfTeam(+teamId);
  }

  @RequirePermissions('team-member:delete')
  @Delete(':teamId/members/:memberId')
  async removeMemberFromTeam(
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.teamService.removeMemberFromTeam(+teamId, +memberId);
  }
}
