import 'dotenv/config';
import { RoleSeed } from './role.seed';
import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionSeed } from './permission.seed';
import { Role } from 'src/authorization/entities/role.entity';
import { Permission } from 'src/authorization/entities/permission.entity';
import { RolePermission } from 'src/authorization/entities/role-permission.entity';
import { SuperAdminSeed } from './superadmin.seed';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB,
      entities: ['../**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Role, Permission, RolePermission]),
    ConfigModule,
  ],
  providers: [SeedService, RoleSeed, PermissionSeed, SuperAdminSeed],
})
export class SeedModule {}
