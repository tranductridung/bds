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
import { RequirePermissions } from '../authentication/decorators/permissions.decorator';

@UseGuards(AuthJwtGuard, PermissionsGuard)
@Controller('authorization')
export class AuthorizationController {
  constructor(private readonly authorizationService: AuthorizationService) {}

  // ----------------------------------- Role -----------------------------------
  @RequirePermissions('authorization:create')
  @Post('roles')
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return await this.authorizationService.createRole(createRoleDto);
  }

  @RequirePermissions('authorization:read')
  @Get('roles')
  async findRoles(@Query() paginationDto: PaginationDto) {
    return await this.authorizationService.findRoles(paginationDto);
  }

  @RequirePermissions('authorization:read')
  @Get('roles/:id')
  async findRole(@Param('id') id: string) {
    return await this.authorizationService.findRole(+id);
  }

  @RequirePermissions('authorization:update')
  @Patch('roles/:id')
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return await this.authorizationService.updateRole(+id, updateRoleDto);
  }

  @RequirePermissions('authorization:delete')
  @Delete('roles/:id')
  async removeRole(@Param('id') id: string) {
    return await this.authorizationService.removeRole(+id);
  }

  @RequirePermissions('authorization:read')
  @Get('roles/:id/permissions')
  async findRolePermissions(@Param('id') id: string) {
    return await this.authorizationService.getRolePermissions(+id);
  }

  // ----------------------------------- Permission -----------------------------------
  @RequirePermissions('authorization:create')
  @Post('permissions')
  async createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return await this.authorizationService.createPermission(
      createPermissionDto,
    );
  }

  @RequirePermissions('authorization:read')
  @Get('permissions')
  async findPermissions(@Query() paginationDto: PaginationDto) {
    return await this.authorizationService.findPermissions(paginationDto);
  }

  @RequirePermissions('authorization:read')
  @Get('permissions/meta')
  async findMeta() {
    return await this.authorizationService.findPermissionMeta();
  }

  @RequirePermissions('authorization:read')
  @Get('permissions/:id')
  async findPermission(@Param('id') id: string) {
    return await this.authorizationService.findPermission(+id);
  }

  @RequirePermissions('authorization:update')
  @Patch('permissions/:id')
  async updatePermission(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return await this.authorizationService.updatePermission(
      +id,
      updatePermissionDto,
    );
  }

  @RequirePermissions('authorization:delete')
  @Delete('permissions/:id')
  async removePermission(@Param('id') id: string) {
    return await this.authorizationService.removePermission(+id);
  }

  // ----------------------------------- User Role -----------------------------------
  @RequirePermissions('authorization:create')
  @Patch('users/:userId/roles')
  async assignRoleToUser(
    @Param('userId') userId: string,
    @Body('roleId') roleId: string,
  ) {
    return await this.authorizationService.assignRoleToUser(+userId, +roleId);
  }

  @RequirePermissions('authorization:delete')
  @Delete('users/:userId/roles/:roleId')
  async removeUserRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @Req() req: Request,
  ) {
    const currentUserId = Number(req?.user?.id);
    return await this.authorizationService.removeUserRole(
      currentUserId,
      +userId,
      +roleId,
    );
  }

  @RequirePermissions('authorization:read')
  @Get('users/:userId/roles')
  async getUserRoles(@Param('userId') userId: string) {
    return await this.authorizationService.getUserRoles(+userId);
  }

  @RequirePermissions('authorization:read')
  @Get('users/:userId/permissions')
  async getUserPermissions(@Param('userId') userId: string) {
    return await this.authorizationService.getUserPermissions(+userId);
  }

  @RequirePermissions('authorization:update')
  @Patch('roles/:roleId/permissions')
  async updatePermissionToRole(
    @Param('roleId') roleId: string,
    @Body('permissionIds') permissionIds: number[],
  ) {
    return await this.authorizationService.updatePermissionsToRole(
      +roleId,
      permissionIds,
    );
  }

  @RequirePermissions('authorization:create')
  @Post('roles/:roleId/permissions')
  async assignPermissionToRole(
    @Param('roleId') roleId: string,
    @Body('permissionId') permissionId: string,
  ) {
    return await this.authorizationService.assignPermissionsToRole(
      +roleId,
      +permissionId,
    );
  }

  @RequirePermissions('authorization:delete')
  @Delete('roles/:roleId/permissions/:permissionId')
  async removePermissionToRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return await this.authorizationService.removePermissionsFromRole(
      +roleId,
      +permissionId,
    );
  }

  @RequirePermissions('authorization:read')
  @Get('roles/:roleId/permissions')
  async getPermissionsOfRole(@Param('roleId') roleId: string) {
    return await this.authorizationService.getPermissionsOfRole(+roleId);
  }
}
