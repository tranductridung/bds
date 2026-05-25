import 'dotenv/config';
import { UserSeed } from './seed-user';
import { RoleSeed } from './role.seed';
import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionSeed } from './permission.seed';
import { Role } from 'src/authorization/entities/role.entity';
import { Permission } from '../authorization/entities/permission.entity';
import { RolePermission } from 'src/authorization/entities/role-permission.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT),
      username: process.env.MYSQL_USERNAME,
      password: process.env.MYSQL_ROOT_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Role, Permission, RolePermission]),
    ConfigModule,
  ],
  providers: [SeedService, RoleSeed, PermissionSeed, UserSeed],
})
export class SeedModule {}
