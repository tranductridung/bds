import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Brackets, DataSource } from 'typeorm';
import { Reminder } from './entities/reminder.entity';
import { UserPayload } from '@/src/authentication/interfaces/user-payload.interface';
@Injectable()
export class ReminderAccessService {
  constructor(private readonly dataSource: DataSource) {}

  async assertCanAccessReminder(user: UserPayload, reminderId: number) {
    const isReminderExist = await this.dataSource
      .getRepository(Reminder)
      .existsBy({ id: reminderId });

    if (!isReminderExist) {
      throw new NotFoundException('Reminder not found');
    }

    if (user.isSystem) return;

    const canAccess = await this.dataSource
      .createQueryBuilder(Reminder, 'reminder')
      .leftJoin('reminder.creator', 'creator')
      .leftJoin('reminder.assignee', 'assignee')
      .where('reminder.id = :reminderId', { reminderId })
      .andWhere(
        new Brackets((qb) => {
          qb.where('assignee.id = :userId').orWhere('creator.id = :userId');
        }),
        { userId: user.id },
      )
      .getExists();

    if (!canAccess) throw new ForbiddenException();
  }
}
