import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReminderService } from './reminder.service';
import { Reminder } from './entities/reminder.entity';
import { ReminderController } from './reminder.controller';
import { ReminderAccessService } from './reminder-access.service';
import { AuthorizationModule } from '../authorization/authorization.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reminder]),
    BullModule.registerQueue({
      name: 'reminder',
    }),
    AuthorizationModule,
  ],
  controllers: [ReminderController],
  providers: [ReminderService, ReminderAccessService],
})
export class ReminderModule {}
