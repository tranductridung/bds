import {
  Req,
  Body,
  Get,
  Query,
  Param,
  Patch,
  UseGuards,
  Controller,
  ParseIntPipe,
  BadRequestException,
  Post,
} from '@nestjs/common';
import { Request } from 'express';
import { UserService } from './user.service';
import { UserStatus } from 'src/common/enums/enum';
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDTO } from './dto/change-pass.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { AuthJwtGuard } from '../authentication/guards/auth.guard';
import { PermissionsGuard } from 'src/authorization/guards/permission.guard';
import { UserPayload } from '../authentication/interfaces/user-payload.interface';
import { RequirePermissions } from '../authentication/decorators/permissions.decorator';

@UseGuards(AuthJwtGuard, PermissionsGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @RequirePermissions('user:create')
  @Post()
  async create(@Req() req: Request, @Body() createUserDto: CreateUserDTO) {
    return await this.userService.createUserBySuperAdmin(
      createUserDto,
      Number(req?.user?.id),
    );
  }

  @RequirePermissions('user:read')
  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    return await this.userService.findAll(paginationDto);
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

    return await this.userService.changeStatus(id, body.status);
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

    return await this.userService.toggleStatus(id);
  }

  @Get('me')
  getUserInfor(@Req() req: Request) {
    return {
      user: {
        id: req?.user?.id,
        email: req?.user?.email,
        fullName: req?.user?.fullName,
        roles: req?.user?.roles,
      },
    };
  }

  @Get('me/profile')
  async getProfile(@Req() req: Request) {
    const userId = Number(req?.user?.id);

    const user = await this.userService.findOne(userId, undefined, undefined);
    return { user };
  }

  @Patch('me')
  async updateProfile(@Req() req: Request, @Body() data: UpdateUserDto) {
    const user = await this.userService.updateUser(Number(req?.user?.id), data);
    return { user };
  }

  @Patch('me/password')
  async changePassword(@Req() req: Request, @Body() data: ChangePasswordDTO) {
    return await this.userService.changePassword(data, Number(req?.user?.id));
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

    return permissions;
  }
}
