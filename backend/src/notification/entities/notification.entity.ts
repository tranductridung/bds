import {
  Entity,
  Column,
  OneToMany,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  NotificationType,
  NotificationObjectType,
} from '../enums/notification.enums';
import { NotificationReceiver } from './notifications_receivers.entity';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column()
  title: string;

  @Column()
  message: string;

  @Column({ nullable: true, type: 'enum', enum: NotificationObjectType })
  objectType: NotificationObjectType | null;

  @Column({ type: 'int', nullable: true })
  objectId: number | null;

  @Column({ type: 'json', nullable: true })
  meta: Record<string, unknown> | null;

  @CreateDateColumn({ select: false })
  createdAt: Date;

  @OneToMany(() => NotificationReceiver, (un) => un.notification)
  notificationReceivers: NotificationReceiver[];
}
