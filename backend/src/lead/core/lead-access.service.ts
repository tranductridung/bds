import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from '../../user/user.service';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { LeadAssignment } from '../assignment/lead-assignment.entity';

@Injectable()
export class LeadAccessService {
  constructor(
    private readonly userService: UserService,
    @InjectRepository(LeadAssignment)
    private readonly leadAssignmentRepo: Repository<LeadAssignment>,
  ) {}

  async assertCanAccessLead(userId: number, leadId: number) {
    const isSystem = await this.userService.isSystemUser(userId);
    if (isSystem) return;

    const isAssignment = await this.leadAssignmentRepo.exists({
      where: {
        lead: { id: leadId },
        agent: { id: userId },
      },
    });

    if (!isAssignment)
      throw new ForbiddenException('You are not assigned to this lead');
  }
}
