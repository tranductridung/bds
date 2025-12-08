import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { UserService } from './../user/user.service';
import { TeamMember } from './entities/team-members.entity';
import { PaginationDto } from '../common/dtos/pagination.dto';

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
    @InjectRepository(TeamMember)
    private readonly teamMemberRepo: Repository<TeamMember>,
    private readonly userService: UserService,
  ) {}

  async create(createTeamDto: CreateTeamDto) {
    const team = this.teamRepo.create(createTeamDto);
    await this.teamRepo.save(team);
    return team;
  }

  async findAll(paginationDto?: PaginationDto) {
    const queryBuilder = this.teamRepo
      .createQueryBuilder('team')
      .addSelect(['team.createdAt'])
      .orderBy('team.createdAt', 'DESC');

    if (
      paginationDto?.page !== undefined &&
      paginationDto?.limit !== undefined
    ) {
      const { page, limit, search } = paginationDto;

      if (search) {
        queryBuilder.where('LOWER(team.name) LIKE :search', {
          search: `%${search.toLowerCase()}%`,
        });
      }

      const [teams, total] = await queryBuilder
        .skip(page * limit)
        .take(limit)
        .getManyAndCount();

      return { teams, total };
    } else {
      const teams = await queryBuilder.getMany();
      return teams;
    }
  }

  async findOne(id: number) {
    const team = await this.teamRepo.findOne({ where: { id } });

    if (!team) {
      throw new NotFoundException('Team not found!');
    }

    return team;
  }

  async update(updateTeamDto: UpdateTeamDto, teamId: number) {
    const team = await this.findOne(teamId);

    const updatedTeam = this.teamRepo.merge(team, updateTeamDto);
    await this.teamRepo.save(updatedTeam);

    return { team: updatedTeam };
  }

  async remove(teamId: number) {
    const team = await this.findOne(teamId);

    await this.teamRepo.remove(team);
    return { message: 'Remove team success' };
  }

  async addMemberToTeam(teamId: number, memberId: number) {
    // Check if team and member is exist
    const member = await this.userService.findOne(memberId, true);
    const team = await this.findOne(teamId);

    // Check if member is exist in team
    const teamMemberExist = await this.teamMemberRepo.findOne({
      where: {
        team: { id: teamId },
        member: { id: memberId },
      },
    });

    if (teamMemberExist)
      throw new BadRequestException('User was added to this team');

    const teamMember = this.teamMemberRepo.create({
      joinedAt: new Date(),
    });
    teamMember.member = member;
    teamMember.team = team;

    await this.teamMemberRepo.save(teamMember);
    return { message: 'Add member to team success' };
  }

  async getMembersOfTeam(teamId: number) {
    const members = await this.teamMemberRepo.find({
      where: { team: { id: teamId } },
    });

    return members;
  }

  async removeMemberFromTeam(teamId: number, memberId: number) {
    // Check if team and member is exist
    await this.userService.findOne(memberId, true);
    await this.findOne(teamId);

    // Check if member is exist in team
    const teamMember = await this.teamMemberRepo.findOne({
      where: {
        team: { id: teamId },
        member: { id: memberId },
      },
    });

    if (!teamMember)
      throw new NotFoundException('User not belong to this team');

    await this.teamMemberRepo.remove(teamMember);
    return { message: 'Remove member success' };
  }
}
