import { Role } from './entities/role.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { forwardRef, Module } from '@nestjs/common';
import { UserRole } from './entities/user-role.entity';
import { Permission } from './entities/permission.entity';
import { AuthorizationService } from './authorization.service';
import { RolePermission } from './entities/role-permission.entity';
import { AuthorizationController } from './authorization.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Permission, Role, RolePermission, UserRole]),
    forwardRef(() => UserModule),
  ],
  controllers: [AuthorizationController],
  providers: [AuthorizationService],
  exports: [AuthorizationService],
})
export class AuthorizationModule {}
