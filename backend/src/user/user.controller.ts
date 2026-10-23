import {
  Req,
  Get,
  Post,
  Body,
  Query,
  Param,
  Patch,
  UseGuards,
  Controller,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { UserService } from './user.service';
import { UserStatus } from './enums/user.enum';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ApiErrorsOld } from '../common/decorators/error-response.decorator';
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDTO } from './dto/change-pass.dto';
import { AuthJwtGuard } from '../authentication/guards/auth.guard';
import { ResponseService } from '../common/helpers/response.service';
import { SuperAdminGuard } from '../authorization/guards/superadmin.guard';
import { UserPayload } from '../authentication/interfaces/user-payload.interface';
import { RequirePermissions } from '../authentication/decorators/permissions.decorator';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { PermissionsGuard } from '../authorization/guards/permission.guard';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(AuthJwtGuard, PermissionsGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @RequirePermissions('user:update')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Ban a user' })
  @ApiParam({ name: 'userId', description: 'User ID to ban', type: 'number' })
  @ApiBody({ schema: { properties: { reason: { type: 'string' } } } })
  @ApiOkResponse({ description: 'User banned successfully' })
  @ApiErrorsOld(403, 404)
  @Post(':userId/ban')
  async banUser(
    @Req() req: Request,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() reason: string,
  ) {
    const user = await this.userService.banUser(
      Number(req?.user?.id),
      userId,
      reason,
      req.requestContext,
    );
    return ResponseService.format(user);
  }

  @RequirePermissions('user:update')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Unban a user' })
  @ApiParam({ name: 'userId', description: 'User ID to unban', type: 'number' })
  @ApiOkResponse({ description: 'User unbanned successfully' })
  @ApiErrorsOld(400, 403, 404)
  @Post(':userId/unban')
  async unbanUser(
    @Req() req: Request,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const user = await this.userService.unbanUser(
      Number(req?.user?.id),
      userId,
    );
    return ResponseService.format(user);
  }

  @RequirePermissions('user:create')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiBody({ type: CreateUserDTO })
  @ApiOkResponse({ description: 'User created successfully' })
  @ApiErrorsOld(400, 409)
  @Post()
  async create(@Req() req: Request, @Body() createUserDto: CreateUserDTO) {
    const user = await this.userService.createUserBySuperAdmin(
      Number(req?.user?.id),
      createUserDto,
    );
    return ResponseService.format(user);
  }

  @RequirePermissions('user:read')
  @ApiOperation({ summary: 'List all users with pagination' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiOkResponse({ description: 'Users retrieved successfully' })
  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const { users, total } = await this.userService.findAll(paginationDto);
    return ResponseService.format(users, { total });
  }

  @RequirePermissions('user:update')
  @ApiOperation({ summary: 'Change user status' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'number' })
  @ApiBody({
    schema: { properties: { status: { enum: Object.values(UserStatus) } } },
  })
  @ApiOkResponse({ description: 'User status changed' })
  @ApiErrorsOld(400, 404)
  @Patch(':id/change-status')
  async changeStatus(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: UserStatus },
  ) {
    const currentUser = req?.user as UserPayload;
    if (id === currentUser?.id)
      throw new BadRequestException('Cannot change status by yourself!');

    const user = await this.userService.changeStatus(id, body.status);
    return ResponseService.format(user);
  }

  @RequirePermissions('user:update')
  @ApiOperation({ summary: 'Toggle user status' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'number' })
  @ApiOkResponse({ description: 'User status toggled' })
  @ApiErrorsOld(400, 404)
  @Patch(':id/toggle-status')
  async toggleStatus(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const currentUser = req?.user;
    if (id === currentUser?.id)
      throw new BadRequestException('Cannot change status by yourself!');

    const user = await this.userService.toggleStatus(id);
    return ResponseService.format(user);
  }

  @ApiOperation({ summary: 'Get current user info' })
  @ApiOkResponse({ description: 'Current user info retrieved' })
  @Get('me')
  getUserInfo(@Req() req: Request) {
    return ResponseService.format({
      id: req?.user?.id,
      email: req?.user?.email,
      fullName: req?.user?.fullName,
      roles: req?.user?.roles,
    });
  }

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ description: 'User profile retrieved' })
  @Get('me/profile')
  async getProfile(@Req() req: Request) {
    const userId = Number(req?.user?.id);

    const user = await this.userService.findOne(userId, undefined, undefined);
    return ResponseService.format(user);
  }

  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({ description: 'Profile updated successfully' })
  @ApiErrorsOld(400)
  @Patch('me')
  async updateProfile(@Req() req: Request, @Body() data: UpdateUserDto) {
    const user = await this.userService.updateUser(Number(req?.user?.id), data);
    return ResponseService.format(user);
  }

  @ApiOperation({ summary: 'Change password for current user' })
  @ApiBody({ type: ChangePasswordDTO })
  @ApiOkResponse({ description: 'Password changed successfully' })
  @ApiErrorsOld(400, 401)
  @Patch('me/password')
  async changePassword(@Req() req: Request, @Body() data: ChangePasswordDTO) {
    await this.userService.changePassword(data, Number(req?.user?.id));
    return ResponseService.format({ message: 'Change password successfully!' });
  }

  @ApiOperation({ summary: 'Get current user permissions' })
  @ApiQuery({
    name: 'resource',
    required: false,
    type: 'string',
    description: 'Filter by resource',
  })
  @ApiOkResponse({ description: 'User permissions retrieved' })
  @Get('me/permissions')
  async getUserPermission(
    @Req() req: Request,
    @Query('resource') resource?: string,
  ) {
    const permissions = await this.userService.getUserPermission(
      Number(req?.user?.id),
      resource,
    );
    return ResponseService.format(permissions);
  }
}
