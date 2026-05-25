import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppService } from './app.service';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { LeadModule } from './lead/lead.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from './mail/mail.module';
import { AppController } from './app.controller';
import { RedisModule } from './redis/redis.module';
import { RedisService } from './redis/redis.service';
import { FeatureModule } from './feature/feature.module';
import { RateLimitGuard } from './redis/rate-limit.guard';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ReminderModule } from './reminder/reminder.module';
import { PropertyModule } from './property/property.module';
import { RatingModule } from './property/rating/rating.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { SystemLogModule } from './log/system-log/system-log.module';
import { NotificationModule } from './notification/notification.module';
import { RefreshTokenModule } from './refresh-token/refresh-token.module';
import { AuthorizationModule } from './authorization/authorization.module';
import { PropertyImageModule } from './property/image/property-image.module';
import { PropertyAgentModule } from './property/agent/property-agent.module';
import { AuthenticationModule } from './authentication/authentication.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT),
      username: process.env.MYSQL_USERNAME,
      password: process.env.MYSQL_ROOT_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    }),
    UserModule,
    RatingModule,
    FeatureModule,
    PropertyModule,
    RefreshTokenModule,
    RefreshTokenModule,
    AuthorizationModule,
    AuthenticationModule,
    PropertyImageModule,
    PropertyAgentModule,
    AuthenticationModule,
    LeadModule,
    MailModule,
    SystemLogModule,
    NotificationModule,
    ReminderModule,
    CloudinaryModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    RedisService,
    { provide: APP_GUARD, useClass: RateLimitGuard },
  ],
})
export class AppModule {}
