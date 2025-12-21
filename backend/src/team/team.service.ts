import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Team } from './entities/team.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from './../user/user.service';
import { MemberRole } from './enums/member-role.enum';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamMember } from './entities/team-members.entity';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { Repository, DataSource, EntityManager, In } from 'typeorm';

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
    @InjectRepository(TeamMember)
    private readonly teamMemberRepo: Repository<TeamMember>,
    private readonly userService: UserService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createTeamDto: CreateTeamDto, ownerId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create team
      const team = queryRunner.manager.create(Team, {
        ...createTeamDto,
        createdBy: ownerId,
      });
      await queryRunner.manager.save(team);

      // Add owner as team member
      const owner = await this.userService.findOne(ownerId, true);

      const teamMember = queryRunner.manager.create(TeamMember, {
        team,
        member: owner,
        role: MemberRole.OWNER,
        joinedAt: new Date(),
      });
      await queryRunner.manager.save(teamMember);

      await queryRunner.commitTransaction();

      return { team, teamMember };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
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

      queryBuilder.skip(page * limit).take(limit);
    }

    const [teams, total] = await queryBuilder.getManyAndCount();

    return { teams, total };
  }

  async findOne(id: number) {
    const team = await this.teamRepo.findOne({ where: { id } });

    if (!team) throw new NotFoundException('Team not found!');

    return team;
  }

  async assertOwner(teamId: number, currentUserId: number) {
    const assertOwner = await this.teamMemberRepo.exists({
      where: {
        team: { id: teamId },
        member: { id: currentUserId },
        role: MemberRole.OWNER,
      },
    });
    if (!assertOwner)
      throw new ForbiddenException('Only owner can update the team');
  }

  async update(
    updateTeamDto: UpdateTeamDto,
    teamId: number,
    currentUserId: number,
  ) {
    await this.findOne(teamId);

    await this.assertOwner(teamId, currentUserId);

    const team = await this.findOne(teamId);

    const updatedTeam = this.teamRepo.merge(team, updateTeamDto);
    await this.teamRepo.save(updatedTeam);

    return updatedTeam;
  }

  async remove(teamId: number, currentUserId: number) {
    await this.findOne(teamId);
    await this.assertOwner(teamId, currentUserId);

    const team = await this.findOne(teamId);

    await this.teamRepo.remove(team);
  }

  async addMemberToTeam(
    currentUserId: number,
    teamId: number,
    memberId: number,
    manager?: EntityManager,
  ) {
    await this.findOne(teamId);

    const repo = manager
      ? manager.getRepository(TeamMember)
      : this.teamMemberRepo;

    // Check permission: OWNER or LEADER of this team
    const canAdd = await repo.exists({
      where: {
        team: { id: teamId },
        member: { id: currentUserId },
        role: In([MemberRole.OWNER, MemberRole.LEADER]),
      },
    });

    if (!canAdd)
      throw new ForbiddenException(
        'You do not have permission to add member to this team',
      );

    // Check team & user exist
    const [team, member] = await Promise.all([
      this.findOne(teamId),
      this.userService.findOne(memberId, true),
    ]);

    // Check already in team
    const exists = await repo.exists({
      where: {
        team: { id: teamId },
        member: { id: memberId },
      },
    });

    if (exists)
      throw new BadRequestException('User already belongs to this team');

    const teamMember = repo.create({
      team,
      member,
      role: MemberRole.MEMBER,
      joinedAt: new Date(),
    });

    await repo.save(teamMember);
    return teamMember;
  }

  async getMembersOfTeam(teamId: number) {
    const members = await this.teamMemberRepo.find({
      where: { team: { id: teamId } },
      relations: ['member'],
    });

    return members;
  }

  async removeMemberFromTeam(
    currentUserId: number,
    teamId: number,
    memberId: number,
  ) {
    await this.findOne(teamId);

    // Check permission
    const canRemove = await this.teamMemberRepo.exists({
      where: {
        team: { id: teamId },
        member: { id: currentUserId },
        role: In([MemberRole.OWNER, MemberRole.LEADER]),
      },
    });

    if (!canRemove)
      throw new ForbiddenException(
        'You do not have permission to remove member from this team',
      );

    const teamMember = await this.teamMemberRepo.findOne({
      where: {
        team: { id: teamId },
        member: { id: memberId },
      },
    });

    if (!teamMember)
      throw new NotFoundException('User does not belong to this team');

    // Cannot remove OWNER
    if (teamMember.role === MemberRole.OWNER)
      throw new BadRequestException('Cannot remove owner from team');

    await this.teamMemberRepo.remove(teamMember);
  }

  async assignRoleForMember(
    currentUserId: number,
    teamId: number,
    memberId: number,
    role: MemberRole,
  ) {
    await this.findOne(teamId);

    // Only OWNER can assign role
    await this.assertOwner(teamId, currentUserId);

    // Disallow assigning OWNER here
    if (role === MemberRole.OWNER)
      throw new BadRequestException(
        'Cannot assign OWNER role using this action',
      );

    if (currentUserId === memberId)
      throw new BadRequestException('Owner cannot change their own role');

    const teamMember = await this.teamMemberRepo.findOne({
      where: {
        team: { id: teamId },
        member: { id: memberId },
      },
    });

    if (!teamMember)
      throw new NotFoundException('User does not belong to this team');

    teamMember.role = role;
    return await this.teamMemberRepo.save(teamMember);
  }

  async changeOwner(
    teamId: number,
    currentOwnerId: number,
    newOwnerId: number,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (currentOwnerId === newOwnerId) {
        throw new BadRequestException(
          'New owner must be different from current owner',
        );
      }

      // Current OWNER
      const currentOwner = await queryRunner.manager.findOne(TeamMember, {
        where: {
          team: { id: teamId },
          member: { id: currentOwnerId },
          role: MemberRole.OWNER,
        },
      });

      if (!currentOwner)
        throw new ForbiddenException('Only owner can transfer ownership');

      // New OWNER
      const newOwner = await queryRunner.manager.findOne(TeamMember, {
        where: {
          team: { id: teamId },
          member: { id: newOwnerId },
        },
      });

      if (!newOwner)
        throw new NotFoundException('New owner does not belong to this team');

      // Transfer
      currentOwner.role = MemberRole.MEMBER;
      newOwner.role = MemberRole.OWNER;

      await queryRunner.manager.save([currentOwner, newOwner]);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
