import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Lead } from './lead.entity';
import { DataSource } from 'typeorm';
import { LeadAssignment } from '../assignment/lead-assignment.entity';
import { UserPayload } from '@/src/authentication/interfaces/user-payload.interface';
@Injectable()
export class LeadAccessService {
  constructor(private readonly dataSource: DataSource) {}

  async assertCanAccessLead(user: UserPayload, leadId: number) {
    const isLeadExist = await this.dataSource
      .getRepository(Lead)
      .exists({ where: { id: leadId } });

    if (!isLeadExist) {
      throw new NotFoundException('Lead not found');
    }

    if (user.isSystem) return;
    const isAgent = await this.dataSource.getRepository(LeadAssignment).exists({
      where: {
        agent: { id: user.id },
        lead: { id: leadId },
      },
    });

    if (!isAgent) throw new ForbiddenException();
  }
}
