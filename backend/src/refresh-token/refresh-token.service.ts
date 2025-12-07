import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MoreThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from 'src/user/user.service';
import { RefreshToken } from './entities/refresh-token.entity';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private tokenRepository: Repository<RefreshToken>,
    private userService: UserService,
    private configService: ConfigService,
  ) {}

  async create(refreshToken: string, userId: number) {
    const numberTokenOfUser = await this.countTokenByUser(userId);

    const maxToken = parseInt(this.configService.get('MAX_TOKEN') ?? '5', 10);

    // Delete oldest token
    if (numberTokenOfUser >= maxToken) {
      const oldestToken = await this.tokenRepository.findOne({
        where: { user: { id: userId }, expiredAt: MoreThan(new Date()) },
        order: { createdAt: 'ASC' },
      });
      if (oldestToken) await this.remove(oldestToken.id);
    }

    const hashedToken = await bcrypt.hash(refreshToken, 10);
    const user = await this.userService.findOne(userId, true);
    const token = this.tokenRepository.create({
      hashedToken,
      user,
      expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return await this.tokenRepository.save(token);
  }

  async removeToken(refreshToken: string, userId: number) {
    const tokens = await this.tokenRepository.find({
      where: { user: { id: userId } },
    });

    for (const token of tokens) {
      if (await bcrypt.compare(refreshToken, token.hashedToken)) {
        return await this.remove(token.id);
      }
    }
  }

  async remove(id: string) {
    await this.tokenRepository.delete({ id });
    return { message: 'Token is removed!' };
  }

  async isTokenExist(refreshToken: string, userId: number) {
    const tokens = await this.tokenRepository.find({
      where: { user: { id: userId } },
    });

    for (const token of tokens) {
      if (await bcrypt.compare(refreshToken, token.hashedToken)) return true;
    }

    return false;
  }

  async countTokenByUser(userId: number) {
    return await this.tokenRepository.count({
      where: { user: { id: userId } },
    });
  }
}
