import { Job } from 'bullmq';
import { DataSource } from 'typeorm';
import { ReminderService } from './reminder.service';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Reminder } from './entities/reminder.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/enums/notification.enums';
import { ReminderProcessStatus, ReminderStatus } from './enums/reminder.enum';
import { CreateNotificationDto } from '../notification/dtos/create-notification.dto';

export type ReminderJobType = {
  reminderId: number;
};

@Processor('reminder')
export class ReminderProcessor extends WorkerHost {
  constructor(
    private readonly reminderService: ReminderService,
    private readonly notificationService: NotificationService,
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async process(job: Job<ReminderJobType>): Promise<void> {
    if (job.name !== 'send-reminder') return;

    const { reminderId } = job.data;

    // Claim reminder (atomic)
    // Just 1 worker can update SCHEDULED → PROCESSING
    const claimResult = await this.dataSource
      .createQueryBuilder()
      .update(Reminder)
      .set({
        processStatus: ReminderProcessStatus.PROCESSING,
      })
      .where(
        `
        id = :id
        AND status = :status
        AND processStatus = :processStatus
        `,
        {
          id: reminderId,
          status: ReminderStatus.ACTIVE,
          processStatus: ReminderProcessStatus.SCHEDULED,
        },
      )
      .execute();

    // Other worker handle or reminder is invalid
    if (claimResult.affected !== 1) {
      return;
    }

    // Load reminder sau khi claim
    const reminder = await this.reminderService.findOneForWorker(reminderId);

    if (!reminder) return;

    try {
      const notificationDto: CreateNotificationDto = {
        receiverIds: [reminder.assignee.id],
        type: NotificationType.REMINDER,
        title: reminder.title,
        message: reminder.message,
      };

      await this.notificationService.notifyUsers(notificationDto);

      // Mark success (idempotent)
      await this.reminderService.triggerSuccess(reminder);
    } catch (error) {
      const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);

      if (isLastAttempt) {
        // Mark failed only on last attempt
        await this.reminderService.triggerFailed(reminder);
      }

      throw error;
    }
  }
}
