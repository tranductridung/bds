import { LeadAssignmentService } from './assignment/lead-assignment.service';
import { Module } from '@nestjs/common';
import { Lead } from './core/lead.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { LeadService } from './core/lead.service';
import { LeadNote } from './note/lead-note.entity';
import { LeadController } from './core/lead.controller';
import { LeadActivity } from './activity/lead-activity.entity';
import { LeadAccessService } from './core/lead-access.service';
import { LeadAssignment } from './assignment/lead-assignment.entity';
import { AuthorizationModule } from '../authorization/authorization.module';
import { LeadAssignmentController } from './assignment/lead-assignment.controller';
import { LeadNoteController } from './note/lead-note.controller';
import { LeadActivityController } from './activity/lead-activity.controller';
import { LeadActivityService } from './activity/lead-activity.service';
import { LeadNoteService } from './note/lead-note.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lead, LeadActivity, LeadAssignment, LeadNote]),
    UserModule,
    AuthorizationModule,
  ],
  controllers: [
    LeadController,
    LeadAssignmentController,
    LeadNoteController,
    LeadActivityController,
  ],
  providers: [
    LeadService,
    LeadNoteService,
    LeadAccessService,
    LeadActivityService,
    LeadAssignmentService,
  ],
  exports: [LeadService],
})
export class LeadModule {}
