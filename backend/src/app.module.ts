import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TeamModule } from './team/team.module';
import { MailModule } from './mail/mail.module';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { FeatureModule } from './feature/feature.module';
import { PropertyModule } from './property/property.module';
import { RatingModule } from './property/rating/rating.module';
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
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    UserModule,
    MailModule,
    TeamModule,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
