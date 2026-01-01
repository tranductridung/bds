import {
  NoteController,
  LeadNoteController,
} from './note/lead-note.controller';
import {
  ActivityController,
  LeadActivityController,
} from './activity/lead-activity.controller';
import {
  AssignmentController,
  LeadAssignmentController,
} from './assignment/lead-assignment.controller';
import { Module } from '@nestjs/common';
import { Lead } from './core/lead.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { LeadService } from './core/lead.service';
import { LeadNote } from './note/lead-note.entity';
import { LeadController } from './core/lead.controller';
import { LeadNoteService } from './note/lead-note.service';
import { LeadActivity } from './activity/lead-activity.entity';
import { LeadAccessService } from './core/lead-access.service';
import { AuditLogModule } from '../log/audit-log/audit-log.module';
import { LeadAssignment } from './assignment/lead-assignment.entity';
import { LeadActivityService } from './activity/lead-activity.service';
import { AuthorizationModule } from '../authorization/authorization.module';
import { LeadAssignmentService } from './assignment/lead-assignment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lead, LeadActivity, LeadAssignment, LeadNote]),
    UserModule,
    AuthorizationModule,
    AuditLogModule,
  ],
  controllers: [
    LeadController,
    LeadAssignmentController,
    LeadNoteController,
    AssignmentController,
    NoteController,
    ActivityController,
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
