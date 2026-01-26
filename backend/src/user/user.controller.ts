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
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDTO } from './dto/change-pass.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { AuthJwtGuard } from '../authentication/guards/auth.guard';
import { ResponseService } from '../common/helpers/response.service';
import { SuperAdminGuard } from '../authorization/guards/superadmin.guard';
import { PermissionsGuard } from 'src/authorization/guards/permission.guard';
import { UserPayload } from '../authentication/interfaces/user-payload.interface';
import { RequirePermissions } from '../authentication/decorators/permissions.decorator';

@UseGuards(AuthJwtGuard, PermissionsGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @RequirePermissions('user:update')
  @UseGuards(SuperAdminGuard)
  @Post()
  async banUser(
    @Req() req: Request,
    @Body('userId', ParseIntPipe) userId: number,
    @Body() reason: string,
  ) {
    const user = await this.userService.banUser(
      Number(req?.user?.id),
      userId,
      reason,
    );
    return ResponseService.format(user);
  }

  @RequirePermissions('user:create')
  @UseGuards(SuperAdminGuard)
  @Post()
  async create(@Req() req: Request, @Body() createUserDto: CreateUserDTO) {
    const user = await this.userService.createUserBySuperAdmin(
      Number(req?.user?.id),
      createUserDto,
    );
    return ResponseService.format(user);
  }

  @RequirePermissions('user:read')
  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const { users, total } = await this.userService.findAll(paginationDto);
    return ResponseService.format(users, { total });
  }

  @RequirePermissions('user:update')
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

  @Get('me')
  getUserInfo(@Req() req: Request) {
    return ResponseService.format({
      id: req?.user?.id,
      email: req?.user?.email,
      fullName: req?.user?.fullName,
      roles: req?.user?.roles,
    });
  }

  @Get('me/profile')
  async getProfile(@Req() req: Request) {
    const userId = Number(req?.user?.id);

    const user = await this.userService.findOne(userId, undefined, undefined);
    return ResponseService.format(user);
  }

  @Patch('me')
  async updateProfile(@Req() req: Request, @Body() data: UpdateUserDto) {
    const user = await this.userService.updateUser(Number(req?.user?.id), data);
    return ResponseService.format(user);
  }

  @Patch('me/password')
  async changePassword(@Req() req: Request, @Body() data: ChangePasswordDTO) {
    await this.userService.changePassword(data, Number(req?.user?.id));
    return ResponseService.format({ message: 'Change password successfully!' });
  }

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
