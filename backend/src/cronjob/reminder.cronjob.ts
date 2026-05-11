import {
  SystemLogAction,
  SystemLogActorType,
  SystemLogTargetType,
} from '../log/enums/system-log.enum';
import {
  ReminderStatus,
  ReminderProcessStatus,
} from '../reminder/enums/reminder.enum';
import { Cron } from '@nestjs/schedule';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReminderService } from '../reminder/reminder.service';
import { Reminder } from '../reminder/entities/reminder.entity';
import { normalizeError } from '../common/errors/normalize-error';
import { SystemLogEvents } from '../log/system-log/events/system-log.event';
import { ListenerSystemLogPayload } from '../log/system-log/events/system-log-events.payload';

@Injectable()
export class ReminderCronService {
  private readonly logger = new Logger(ReminderCronService.name);
  private readonly QUEUE_WINDOW_MS =
    Number(process.env.QUEUE_WINDOW_MS) || 60 * 60 * 1000;

  constructor(
    private readonly dataSource: DataSource,
    private readonly reminderService: ReminderService,
    @InjectRepository(Reminder)
    private readonly reminderRepo: Repository<Reminder>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron('/5 * * * *')
  async handleReminderQueueing() {
    try {
      const now = new Date();
      const windowEnd = new Date(now.getTime() + this.QUEUE_WINDOW_MS);

      const reminders = await this.reminderRepo
        .createQueryBuilder('r')
        .select(['r.id'])
        .where('r.status = :status', { status: ReminderStatus.ACTIVE })
        .andWhere('r.processStatus = :processStatus', {
          processStatus: ReminderProcessStatus.PENDING,
        })
        .andWhere('r.remindAt BETWEEN :now AND :windowEnd', {
          now,
          windowEnd,
        })
        .orderBy('r.remindAt', 'ASC')
        .limit(100)
        .getMany();

      await Promise.all(reminders.map((r) => this.queueReminderSafely(r.id)));
    } catch (exception) {
      const errorResult = normalizeError(exception);

      this.logger.error(
        errorResult.message,
        errorResult.stack,
        ReminderCronService.name,
      );

      this.eventEmitter.emit(SystemLogEvents.CRON_FAILED, {
        path: undefined,
        method: undefined,
        statusCode: errorResult.status,
        action: SystemLogAction.CRON_FAILED,
        actorId: undefined,
        actorType: SystemLogActorType.SYSTEM,
        targetType: SystemLogTargetType.CRON,
        targetId: undefined,
        meta: {
          message: errorResult.message,
          exception: errorResult.name,
          stack: errorResult.stack,
        },
      } satisfies ListenerSystemLogPayload);
    }
  }

  async queueReminderSafely(reminderId: number) {
    const claimResult = await this.dataSource
      .createQueryBuilder()
      .update(Reminder)
      .set({
        processStatus: ReminderProcessStatus.SCHEDULING,
      })
      .where(
        `
        id = :id
        AND status = :status
        AND processStatus = :processStatus
        AND jobId IS NULL
        `,
        {
          id: reminderId,
          status: ReminderStatus.ACTIVE,
          processStatus: ReminderProcessStatus.PENDING,
        },
      )
      .execute();

    if (claimResult.affected !== 1) return;

    try {
      // Add job to queue
      const reminder = await this.reminderService.findOne(reminderId);

      const job = await this.reminderService.addJob(
        reminder.id,
        reminder.remindAt,
      );

      await this.reminderRepo.update(reminder.id, {
        jobId: job.id,
        processStatus: ReminderProcessStatus.SCHEDULED,
      });
    } catch (error) {
      // Rollback so cron can retry later
      await this.reminderRepo.update(reminderId, {
        processStatus: ReminderProcessStatus.PENDING,
      });

      throw error;
    }
  }
}
