import {
  Req,
  Get,
  Body,
  Post,
  Query,
  Patch,
  Param,
  Delete,
  Controller,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { UpdateRoleDto } from './dtos/update-role.dto';
import { CreateRoleDto } from './dtos/create-role.dto';
import { PermissionsGuard } from './guards/permission.guard';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { AuthorizationService } from './authorization.service';
import { UpdatePermissionDto } from './dtos/update-permission.dto';
import { CreatePermissionDto } from './dtos/create-permission.dto';
import { AuthJwtGuard } from '../authentication/guards/auth.guard';
import { ResponseService } from '../common/helpers/response.service';
import { RequirePermissions } from '../authentication/decorators/permissions.decorator';

@UseGuards(AuthJwtGuard, PermissionsGuard)
@Controller('authorization')
export class AuthorizationController {
  constructor(private readonly authorizationService: AuthorizationService) {}

  // ----------------------------------- Role -----------------------------------
  @RequirePermissions('authorization:create')
  @Post('roles')
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    const role = await this.authorizationService.createRole(createRoleDto);
    return ResponseService.format(role);
  }

  @RequirePermissions('authorization:read')
  @Get('roles')
  async findRoles(@Query() paginationDto: PaginationDto) {
    const { roles, total } =
      await this.authorizationService.findRoles(paginationDto);
    return ResponseService.format(roles, { total });
  }

  @RequirePermissions('authorization:read')
  @Get('roles/:id')
  async findRole(@Param('id', ParseIntPipe) id: number) {
    const role = await this.authorizationService.findRole(id);
    return ResponseService.format(role);
  }

  @RequirePermissions('authorization:update')
  @Patch('roles/:id')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    const role = await this.authorizationService.updateRole(id, updateRoleDto);
    return ResponseService.format(role);
  }

  @RequirePermissions('authorization:delete')
  @Delete('roles/:id')
  async removeRole(@Param('id', ParseIntPipe) id: number) {
    await this.authorizationService.removeRole(id);
    return ResponseService.format({ message: 'Delete role success!' });
  }

  @RequirePermissions('authorization:read')
  @Get('roles/:id/permissions')
  async findRolePermissions(@Param('id', ParseIntPipe) id: number) {
    const permissions = await this.authorizationService.getRolePermissions(id);
    return ResponseService.format(permissions);
  }

  // ----------------------------------- Permission -----------------------------------
  @RequirePermissions('authorization:create')
  @Post('permissions')
  async createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    const permission =
      await this.authorizationService.createPermission(createPermissionDto);

    return ResponseService.format(permission);
  }

  @RequirePermissions('authorization:read')
  @Get('permissions')
  async findPermissions(@Query() paginationDto: PaginationDto) {
    const { permissions, total } =
      await this.authorizationService.findPermissions(paginationDto);
    return ResponseService.format(permissions, { total });
  }

  @RequirePermissions('authorization:read')
  @Get('permissions/meta')
  async findMeta() {
    const response = await this.authorizationService.findPermissionMeta();
    return ResponseService.format(response);
  }

  @RequirePermissions('authorization:read')
  @Get('permissions/:id')
  async findPermission(@Param('id', ParseIntPipe) id: number) {
    const permission = await this.authorizationService.findPermission(id);
    return ResponseService.format(permission);
  }

  @RequirePermissions('authorization:update')
  @Patch('permissions/:id')
  async updatePermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    const permission = await this.authorizationService.updatePermission(
      id,
      updatePermissionDto,
    );
    return ResponseService.format(permission);
  }

  @RequirePermissions('authorization:delete')
  @Delete('permissions/:id')
  async removePermission(@Param('id', ParseIntPipe) id: number) {
    await this.authorizationService.removePermission(id);
    return ResponseService.format({ message: 'Delete permission success!' });
  }

  // ----------------------------------- User Role -----------------------------------
  @RequirePermissions('authorization:create')
  @Patch('users/:userId/roles')
  async assignRoleToUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Body('roleId', ParseIntPipe) roleId: number,
  ) {
    const userRole = await this.authorizationService.assignRoleToUser(
      userId,
      roleId,
    );
    return ResponseService.format(userRole);
  }

  @RequirePermissions('authorization:delete')
  @Delete('users/:userId/roles/:roleId')
  async removeUserRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
    @Req() req: Request,
  ) {
    const currentUserId = Number(req?.user?.id);
    await this.authorizationService.removeUserRole(
      currentUserId,
      userId,
      roleId,
    );

    return ResponseService.format({ message: 'Delete user role success!' });
  }

  @RequirePermissions('authorization:read')
  @Get('users/:userId/roles')
  async getRolesOfUser(@Param('userId', ParseIntPipe) userId: number) {
    const roles = await this.authorizationService.getRolesOfUser(userId);
    return ResponseService.format(roles);
  }

  @RequirePermissions('authorization:read')
  @Get('users/:userId/permissions')
  async getUserPermissions(@Param('userId', ParseIntPipe) userId: number) {
    const permissions =
      await this.authorizationService.getUserPermissions(userId);
    return ResponseService.format(permissions);
  }

  @RequirePermissions('authorization:update')
  @Patch('roles/:roleId/permissions')
  async updatePermissionToRole(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body('permissionIds') permissionIds: number[],
  ) {
    const response = await this.authorizationService.updatePermissionsToRole(
      roleId,
      permissionIds,
    );

    return ResponseService.format(response);
  }

  @RequirePermissions('authorization:create')
  @Post('roles/:roleId/permissions')
  async assignPermissionToRole(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body('permissionId', ParseIntPipe) permissionId: number,
  ) {
    const rolePermisison =
      await this.authorizationService.assignPermissionsToRole(
        roleId,
        permissionId,
      );
    return ResponseService.format(rolePermisison);
  }

  @RequirePermissions('authorization:delete')
  @Delete('roles/:roleId/permissions/:permissionId')
  async removePermissionToRole(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    await this.authorizationService.removePermissionsFromRole(
      roleId,
      permissionId,
    );

    return ResponseService.format({
      message: 'Remove permissions from role success!',
    });
  }

  @RequirePermissions('authorization:read')
  @Get('roles/:roleId/permissions')
  async getPermissionsOfRole(@Param('roleId', ParseIntPipe) roleId: number) {
    const permissions =
      await this.authorizationService.getPermissionsOfRole(roleId);
    return ResponseService.format(permissions);
  }
}
