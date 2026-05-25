import {
  Req,
  Get,
  Body,
  Post,
  Query,
  Patch,
  Param,
  Delete,
  UseGuards,
  Controller,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBody,
  ApiParam,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { UpdateRoleDto } from './dtos/update-role.dto';
import { CreateRoleDto } from './dtos/create-role.dto';
import { PermissionsGuard } from './guards/permission.guard';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { AuthorizationService } from './authorization.service';
import { ApiResponseDto } from '../common/dtos/api-response.dto';
import { UpdatePermissionDto } from './dtos/update-permission.dto';
import { CreatePermissionDto } from './dtos/create-permission.dto';
import { AuthJwtGuard } from '../authentication/guards/auth.guard';
import { RoleResponseDto } from './dtos/responses/role.response.dto';
import { MessageResponseDto } from '../common/dtos/message-response';
import { ResponseService } from '../common/helpers/response.service';
import { PermissionResponseDto } from './dtos/responses/permission.response';
import { RequirePermissions } from '../authentication/decorators/permissions.decorator';
import { PermissionMetaResponseDto } from './dtos/responses/permission-meta.response.dto';
import { RolePermissionResponseDto } from './dtos/responses/update-role-permission.response';
import { ApiErrors } from '../common/decorators/error-response.decorator';

@ApiTags('Authorization')
@ApiBearerAuth('access-token')
@UseGuards(AuthJwtGuard, PermissionsGuard)
@Controller('authorization')
export class AuthorizationController {
  constructor(private readonly authorizationService: AuthorizationService) {}

  // ----------------------------------- Role -----------------------------------
  @RequirePermissions('authorization:create')
  @ApiOperation({ summary: 'Create a new role' })
  @ApiBody({ type: CreateRoleDto })
  @ApiOkResponse({
    type: ApiResponseDto<RoleResponseDto>(RoleResponseDto),
    description: 'Role created successfully',
  })
  @ApiErrors(409)
  @Post('roles')
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    const role = await this.authorizationService.createRole(createRoleDto);
    return ResponseService.format(role);
  }

  @RequirePermissions('authorization:read')
  @ApiOperation({ summary: 'List roles with pagination' })
  @ApiOkResponse({
    type: ApiResponseDto<RoleResponseDto>(RoleResponseDto, true),
    description: 'Roles retrieved successfully',
  })
  @ApiErrors(404)
  @Get('roles')
  async findRoles(@Query() paginationDto: PaginationDto) {
    const { roles, total } =
      await this.authorizationService.findRoles(paginationDto);
    return ResponseService.format(roles, { total });
  }

  @RequirePermissions('authorization:read')
  @ApiOperation({ summary: 'Get role by id' })
  @ApiParam({ name: 'id', description: 'Role id', type: 'number' })
  @ApiOkResponse({
    type: ApiResponseDto<RoleResponseDto>(RoleResponseDto),
    description: 'Role retrieved',
  })
  @ApiErrors(404)
  @Get('roles/:id')
  async findRole(@Param('id', ParseIntPipe) id: number) {
    const role = await this.authorizationService.findRole(id);
    return ResponseService.format(role);
  }

  @RequirePermissions('authorization:update')
  @ApiOperation({ summary: 'Update role by id' })
  @ApiParam({ name: 'id', description: 'Role id', type: 'number' })
  @ApiBody({ type: UpdateRoleDto })
  @ApiOkResponse({
    type: ApiResponseDto<RoleResponseDto>(RoleResponseDto),
    description: 'Role updated',
  })
  @ApiErrors(409, 404)
  @Patch('roles/:id')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    const role = await this.authorizationService.updateRole(id, updateRoleDto);
    return ResponseService.format(role);
  }

  @RequirePermissions('authorization:delete')
  @ApiOperation({ summary: 'Delete role by id' })
  @ApiParam({ name: 'id', description: 'Role id', type: 'number' })
  @ApiOkResponse({
    type: ApiResponseDto<MessageResponseDto>(MessageResponseDto),
    description: 'Role deleted',
  })
  @ApiErrors(404)
  @Delete('roles/:id')
  async removeRole(@Param('id', ParseIntPipe) id: number) {
    await this.authorizationService.removeRole(id);
    return ResponseService.format({ message: 'Delete role success!' });
  }

  @RequirePermissions('authorization:read')
  @ApiOperation({ summary: 'Get permissions for a role' })
  @ApiParam({ name: 'id', description: 'Role id', type: 'number' })
  @ApiOkResponse({
    type: ApiResponseDto<PermissionResponseDto>(PermissionResponseDto, true),
    description: 'Permissions retrieved',
  })
  @ApiErrors(404)
  @Get('roles/:id/permissions')
  async findRolePermissions(@Param('id', ParseIntPipe) id: number) {
    const permissions = await this.authorizationService.getRolePermissions(id);
    return ResponseService.format(permissions);
  }

  // ----------------------------------- Permission -----------------------------------
  @RequirePermissions('authorization:create')
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiBody({ type: CreatePermissionDto })
  @ApiOkResponse({
    type: ApiResponseDto<PermissionResponseDto>(PermissionResponseDto),
    description: 'Permission created',
  })
  @ApiErrors(400)
  @Post('permissions')
  async createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    const permission =
      await this.authorizationService.createPermission(createPermissionDto);

    return ResponseService.format(permission);
  }

  @RequirePermissions('authorization:read')
  @ApiOperation({ summary: 'List permissions with pagination' })
  @ApiOkResponse({
    type: ApiResponseDto<PermissionResponseDto>(PermissionResponseDto, true),
    description: 'Permissions retrieved successfully',
  })
  @ApiErrors(400)
  @Get('permissions')
  async findPermissions(@Query() paginationDto: PaginationDto) {
    const { permissions, total } =
      await this.authorizationService.findPermissions(paginationDto);
    return ResponseService.format(permissions, { total });
  }

  @RequirePermissions('authorization:read')
  @ApiOperation({ summary: 'Get permission metadata' })
  @ApiOkResponse({
    type: ApiResponseDto<PermissionMetaResponseDto>(PermissionMetaResponseDto),
    description: 'Permission metadata retrieved',
  })
  @Get('permissions/meta')
  async findMeta() {
    const { actions, resources } =
      await this.authorizationService.findPermissionMeta();
    return ResponseService.format({ actions, resources });
  }

  @RequirePermissions('authorization:read')
  @ApiOperation({ summary: 'Get permission by id' })
  @ApiParam({ name: 'id', description: 'Permission id', type: 'number' })
  @ApiOkResponse({
    type: ApiResponseDto<PermissionResponseDto>(PermissionResponseDto),
    description: 'Permission retrieved',
  })
  @ApiErrors(404)
  @Get('permissions/:id')
  async findPermission(@Param('id', ParseIntPipe) id: number) {
    const permission = await this.authorizationService.findPermission(id);
    return ResponseService.format(permission);
  }

  @RequirePermissions('authorization:update')
  @ApiOperation({ summary: 'Update permission by id' })
  @ApiParam({ name: 'id', description: 'Permission id', type: 'number' })
  @ApiBody({ type: UpdatePermissionDto })
  @ApiOkResponse({
    type: ApiResponseDto<PermissionResponseDto>(PermissionResponseDto),
    description: 'Permission updated',
  })
  @ApiErrors(400, 404)
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
  @ApiOperation({ summary: 'Delete permission by id' })
  @ApiParam({ name: 'id', description: 'Permission id', type: 'number' })
  @ApiOkResponse({
    type: ApiResponseDto<MessageResponseDto>(MessageResponseDto),
    description: 'Permission deleted',
  })
  @ApiErrors(404)
  @Delete('permissions/:id')
  async removePermission(@Param('id', ParseIntPipe) id: number) {
    await this.authorizationService.removePermission(id);
    return ResponseService.format({ message: 'Delete permission success!' });
  }

  // ----------------------------------- User Role -----------------------------------
  @RequirePermissions('authorization:create')
  @ApiOperation({ summary: 'Assign a role to a user' })
  @ApiParam({ name: 'userId', description: 'User id', type: 'number' })
  @ApiBody({
    schema: {
      properties: { roleId: { type: 'number' } },
      required: ['roleId'],
    },
  })
  @ApiOkResponse({
    // type: ApiResponseDto<UserRoleResponseDto>(UserRoleResponseDto),
    description: 'Role assigned to user',
  })
  @ApiErrors(400)
  @Patch('users/:userId/roles')
  async assignRoleToUser(
    @Req() req: Request,
    @Param('userId', ParseIntPipe) userId: number,
    @Body('roleId', ParseIntPipe) roleId: number,
  ) {
    const userRole = await this.authorizationService.assignRoleToUser(
      Number(req?.user?.id),
      userId,
      roleId,
    );
    return ResponseService.format(userRole);
  }

  @RequirePermissions('authorization:delete')
  @ApiOperation({ summary: 'Remove a role from a user' })
  @ApiParam({ name: 'userId', description: 'User id', type: 'number' })
  @ApiParam({ name: 'roleId', description: 'Role id', type: 'number' })
  @ApiOkResponse({
    type: ApiResponseDto<MessageResponseDto>(MessageResponseDto),
    description: 'Role removed from user',
  })
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
  @ApiOperation({ summary: 'Get roles of a user' })
  @ApiParam({ name: 'userId', description: 'User id', type: 'number' })
  @ApiOkResponse({
    // type: ApiResponseDto<UserRoleResponseDto>(UserRoleResponseDto, true),
    description: 'User roles retrieved',
  })
  @Get('users/:userId/roles')
  async getRolesOfUser(@Param('userId', ParseIntPipe) userId: number) {
    const userRoles = await this.authorizationService.getRolesOfUser(userId);
    return ResponseService.format(userRoles);
  }

  @RequirePermissions('authorization:read')
  @ApiOperation({ summary: 'Get permissions of a user' })
  @ApiParam({ name: 'userId', description: 'User id', type: 'number' })
  @ApiOkResponse({
    type: ApiResponseDto<PermissionResponseDto>(PermissionResponseDto, true),
    description: 'User permissions retrieved',
  })
  @Get('users/:userId/permissions')
  async getUserPermissions(@Param('userId', ParseIntPipe) userId: number) {
    const permissions =
      await this.authorizationService.getUserPermissions(userId);
    return ResponseService.format(permissions);
  }

  @RequirePermissions('authorization:update')
  @ApiOperation({ summary: 'Update permissions of a role' })
  @ApiParam({ name: 'roleId', description: 'Role id', type: 'number' })
  @ApiBody({
    schema: {
      properties: {
        permissionIds: { type: 'array', items: { type: 'number' } },
      },
      required: ['permissionIds'],
    },
  })
  @ApiOkResponse({
    type: ApiResponseDto<MessageResponseDto>(MessageResponseDto),
    description: 'Permissions updated for role',
  })
  @Patch('roles/:roleId/permissions')
  async updatePermissionToRole(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body('permissionIds') permissionIds: number[],
  ) {
    await this.authorizationService.updatePermissionsToRole(
      roleId,
      permissionIds,
    );

    return ResponseService.format({
      message: 'Update permissions to role success!',
    });
  }

  @RequirePermissions('authorization:create')
  @ApiOperation({ summary: 'Assign a permission to a role' })
  @ApiParam({ name: 'roleId', description: 'Role id', type: 'number' })
  @ApiBody({
    schema: {
      properties: { permissionId: { type: 'number' } },
      required: ['permissionId'],
    },
  })
  @ApiOkResponse({
    type: ApiResponseDto<RolePermissionResponseDto>(RolePermissionResponseDto),
    description: 'Permission assigned to role',
  })
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
  @ApiOperation({ summary: 'Remove a permission from a role' })
  @ApiParam({ name: 'roleId', description: 'Role id', type: 'number' })
  @ApiParam({
    name: 'permissionId',
    description: 'Permission id',
    type: 'number',
  })
  @ApiOkResponse({
    type: ApiResponseDto<MessageResponseDto>(MessageResponseDto),
    description: 'Permission removed from role',
  })
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
  @ApiOperation({ summary: 'Get permissions of a role' })
  @ApiParam({ name: 'roleId', description: 'Role id', type: 'number' })
  @ApiOkResponse({
    type: ApiResponseDto<PermissionResponseDto>(PermissionResponseDto, true),
    description: 'Role permissions retrieved',
  })
  @Get('roles/:roleId/permissions')
  async getPermissionsOfRole(@Param('roleId', ParseIntPipe) roleId: number) {
    const permissions =
      await this.authorizationService.getPermissionsOfRole(roleId);
    return ResponseService.format(permissions);
  }
}
