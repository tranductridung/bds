import {
  Entity,
  Unique,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Notification } from './notification.entity';
import { User } from '@/src/user/entities/user.entity';

@Entity('notifications_receivers')
@Unique(['notificationId', 'receiverId'])
export class NotificationReceiver {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  notificationId: number;

  @Column()
  receiverId: number;

  @Column({ type: 'date', nullable: true, default: null })
  readAt: Date | null;

  @Column({ type: 'date', nullable: true, default: null })
  deletedAt: Date | null;

  @ManyToOne(
    () => Notification,
    (notification) => notification.notificationReceivers,
    {
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({ name: 'notificationId' })
  notification: Notification;

  @ManyToOne(() => User, (receiver) => receiver.notificationReceivers, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'receiverId' })
  receiver: User;
}
