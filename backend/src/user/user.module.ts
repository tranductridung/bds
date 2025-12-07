import { JwtModule } from '@nestjs/jwt';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { MailModule } from '../mail/mail.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { forwardRef, Module } from '@nestjs/common';
import { AuthorizationModule } from 'src/authorization/authorization.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => AuthorizationModule),
    JwtModule,
    MailModule,
  ],
  exports: [TypeOrmModule, UserService],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
