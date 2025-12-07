import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserStatus } from '../common/enums/enum';
import { User } from '../user/entities/user.entity';
import { Role } from '../authorization/entities/role.entity';
import { UserRole } from '../authorization/entities/user-role.entity';

@Injectable()
export class SuperAdminSeed {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async seed() {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get Superadmin role
      const superadminRole = await queryRunner.manager.findOneBy(Role, {
        name: 'superadmin',
      });

      if (!superadminRole) {
        console.log('Role superadmin not found! Please seed roles first.');
        await queryRunner.rollbackTransaction();
        return;
      }

      // Check if superadmin already exists
      const superAdminCount = await queryRunner.manager.count(UserRole, {
        where: {
          role: { id: superadminRole.id },
        },
      });

      if (superAdminCount >= 1) {
        console.log('Superadmin already exists, skipping seed...');
        await queryRunner.rollbackTransaction();
        return;
      }

      // Create user
      const email =
        this.configService.get<string>('SUPERADMIN_EMAIL') ||
        'superadmin@gmail.com';

      const password =
        this.configService.get<string>('SUPERADMIN_PASSWORD') || 'superadmin';

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = queryRunner.manager.create(User, {
        fullName: 'Super Admin',
        email,
        password: hashedPassword,
        status: UserStatus.ACTIVE,
      });

      await queryRunner.manager.save(user);

      // Assign superadmin role
      const userRole = queryRunner.manager.create(UserRole, {
        user: { id: user.id },
        role: { id: superadminRole.id },
      });

      await queryRunner.manager.save(userRole);

      // Commit
      await queryRunner.commitTransaction();

      console.log('Superadmin seeded successfully!');
      console.log('Email:', email);
      console.log('Password:', password);
    } catch (error) {
      console.error('Seed superadmin failed:', error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
