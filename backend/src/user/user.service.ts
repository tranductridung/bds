import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { Repository, DataSource } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { InjectRepository } from '@nestjs/typeorm';
import { UserStatus } from 'src/common/enums/enum';
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDTO } from './dto/change-pass.dto';
import { Role } from '../authorization/entities/role.entity';
import { PaginationDto } from './../common/dtos/pagination.dto';
import { AuthorizationService } from './../authorization/authorization.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async findAll(paginationDto?: PaginationDto) {
    const queryBuilder = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'ur')
      .leftJoinAndSelect('ur.role', 'role')
      .addSelect(['user.createdAt'])
      .orderBy('user.createdAt', 'DESC');

    if (
      paginationDto?.page !== undefined &&
      paginationDto?.limit !== undefined
    ) {
      const { page, limit, search } = paginationDto;

      if (search) {
        queryBuilder.where('LOWER(user.fullName) LIKE :search', {
          search: `%${search.toLowerCase()}%`,
        });
      }

      const [users, total] = await queryBuilder
        .skip(page * limit)
        .take(limit)
        .getManyAndCount();

      return { users, total };
    } else {
      const users = await queryBuilder.getMany();
      return users;
    }
  }

  async findByEmail(email: string, isActive?: boolean) {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'userRole')
      .leftJoinAndSelect('userRole.role', 'role')
      .where('user.email = :email', { email })
      .select([
        'user.id',
        'user.email',
        'user.fullName',
        'user.password',
        'user.status',
        'userRole',
        'role.name',
      ])
      .getOne();

    if (!user) throw new NotFoundException('User not found!');

    if (isActive && user.status !== UserStatus.ACTIVE)
      throw new BadRequestException(`User status is ${user.status}!`);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      password: user.password,
      status: user.status,
      roles: user.userRoles.map((userRole) => userRole.role.name),
    };
  }

  async findOne(id: number, isActive?: boolean, getUserRoles?: boolean) {
    const queryBuilder = this.userRepo.createQueryBuilder('user');

    if (getUserRoles) {
      queryBuilder
        .leftJoinAndSelect('user.userRoles', 'ur')
        .leftJoinAndSelect('ur.role', 'role');
    }

    queryBuilder.where('user.id = :id', { id });

    const user = await queryBuilder.getOne();

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    if (isActive && user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('User is not active!');
    }

    return user;
  }

  async countUser() {
    return this.userRepo.count();
  }

  async changeStatus(id: number, status: UserStatus) {
    const user = await this.findOne(id);
    user.status = status;
    await this.userRepo.save(user);
    return { message: `User status is changed to ${user.status}` };
  }

  async toggleStatus(id: number) {
    const user = await this.findOne(id);
    user.status =
      user.status === UserStatus.ACTIVE
        ? UserStatus.INACTIVE
        : UserStatus.ACTIVE;
    await this.userRepo.save(user);
    return { message: `User status is changed to ${user.status}` };
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);

    this.userRepo.merge(user, updateUserDto);

    await this.userRepo.save(user);

    const { password, ...result } = user;
    return result;
  }

  async resetPassword(newPassword: string, id: number) {
    const user = await this.userRepo.findOne({
      where: { id, status: UserStatus.ACTIVE },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    user.password = await bcrypt.hash(
      newPassword,
      Number(this.configService.get('SALT')) || 10,
    );

    await this.userRepo.save(user);

    return { message: 'Reset password success!' };
  }

  async changePassword(data: ChangePasswordDTO, id: number) {
    const user = await this.userRepo.findOne({
      where: { id },
      select: ['id', 'password'],
    });

    if (!user) throw new NotFoundException('User not found!');

    if (!user.password)
      throw new BadRequestException(
        'Password not set for this user. Please check your email to set your password!',
      );

    const isMatch = await bcrypt.compare(data.oldPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Password incorrect!');
    }

    user.password = await bcrypt.hash(
      data.newPassword,
      Number(this.configService.get('SALT')) || 10,
    );

    await this.userRepo.save(user);

    return { message: 'Change password success!' };
  }

  async getUserPermission(userId: number, resource?: string) {
    const permissions = await this.authorizationService.getPermissions(
      userId,
      resource,
    );
    return permissions;
  }

  async createInitialSuperAdmin(createUserDto: CreateUserDTO) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userCount = await this.countUser();
      if (userCount > 0)
        throw new ConflictException('Superadmin already exists!');

      const user = queryRunner.manager.create(User, {
        ...createUserDto,
        status: UserStatus.ACTIVE,
      });

      user.password = await bcrypt.hash(
        this.configService.get('SUPERADMIN_PASSWORD') || 'superadmin',
        10,
      );
      await queryRunner.manager.save(user);

      const adminRole =
        await this.authorizationService.findRoleByName('superadmin');
      await this.authorizationService.assignRoleToUser(
        user.id,
        adminRole.id,
        queryRunner.manager,
      );

      const { password, ...result } = user;
      await queryRunner.commitTransaction();
      return { ...result, roles: ['superadmin'] };
    } catch (error) {
      console.log(error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createUserBySuperAdmin(
    createUserDto: CreateUserDTO,
    creatorId: number,
  ) {
    // Check if creator is superadmin
    const creatorRoles =
      await this.authorizationService.getUserRoles(creatorId);

    if (!creatorRoles.roles.some((r) => r.name === 'superadmin')) {
      throw new ForbiddenException('Only superadmin can create users');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let newUser: User;

    try {
      // Check duplicate email inside transaction
      const userExist = await queryRunner.manager.findOne(User, {
        where: { email: createUserDto.email },
      });
      if (userExist) throw new ConflictException('Email already used');

      // Validate role
      if (!createUserDto.role)
        throw new BadRequestException('Role is required');

      const role = await queryRunner.manager.findOne(Role, {
        where: { name: createUserDto.role },
      });
      if (!role) throw new NotFoundException('Role not found');

      // Create user
      newUser = queryRunner.manager.create(User, {
        ...createUserDto,
        status: UserStatus.UNVERIFIED,
      });
      await queryRunner.manager.save(newUser);

      // Assign role to user
      await this.authorizationService.assignRoleToUser(
        newUser.id,
        role.id,
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    // ---- EMAIL SHOULD BE SENT AFTER COMMIT ----
    const userRoles = await this.authorizationService.getUserRoles(newUser.id);
    const roles = userRoles.roles.map((r) => r.name);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const payload = {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
    };

    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('SETUP_PASSWORD_TOKEN'),
      expiresIn: this.configService.get('SETUP_PASSWORD_TOKEN_EXPIRES'),
    });

    const setupPwdLink = `${frontendUrl}/authentication/setup-password?token=${token}`;
    await this.mailService.setupPasswordEmail(newUser.email, setupPwdLink);

    // Remove sensitive data
    const { password, ...result } = newUser;

    return {
      ...result,
      roles,
    };
  }
}
