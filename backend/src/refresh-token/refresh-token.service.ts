import * as bcrypt from 'bcrypt';
import { EntityManager, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from 'src/user/user.service';
import { Injectable, NotFoundException } from '@nestjs/common';
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
      const oldestToken = await this.tokenRepository
        .createQueryBuilder('token')
        .addSelect('token.createdAt')
        .where('token.userId = :userId', { userId })
        .andWhere('token.expiredAt > :now', { now: new Date() })
        .orderBy('token.createdAt', 'ASC')
        .getOne();

      if (oldestToken) await this.remove(oldestToken.id);
    }

    const hashedToken = await bcrypt.hash(refreshToken, 10);
    const user = await this.userService.findOne(userId, true);
    const token = this.tokenRepository.create({
      hashedToken,
      user,
      expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await this.tokenRepository.save(token);
    return token;
  }

  async revokeToken(refreshToken: string, userId: number) {
    const tokens = await this.tokenRepository.find({
      where: { user: { id: userId } },
    });

    for (const token of tokens) {
      if (await bcrypt.compare(refreshToken, token.hashedToken)) {
        return await this.remove(token.id);
      }
    }
  }

  async revokeAllTokens(userId: number, manager?: EntityManager) {
    const repo = manager
      ? manager.getRepository(RefreshToken)
      : this.tokenRepository;
    await repo
      .createQueryBuilder()
      .update()
      .set({
        revokedAt: new Date(),
      })
      .where('userId = :userId', { userId })
      .andWhere('revokedAt IS NULL')
      .execute();
  }

  async remove(id: string) {
    await this.tokenRepository.update(id, { revokedAt: new Date() });
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

  async find() {
    const tokens = await this.tokenRepository.find();
    return tokens;
  }

  async findOne(id: string) {
    const token = await this.tokenRepository.findOneBy({ id });
    if (!token) throw new NotFoundException('Token not found');
    return token;
  }

  async cleanupExpiredTokens(now: Date, limit = 1000) {
    try {
      const threshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const ids = await this.tokenRepository
        .createQueryBuilder('t')
        .select('t.id', 'id')
        .where('t.expiredAt < :threshold OR t.revokedAt < :threshold', {
          threshold,
        })
        .orderBy('LEAST(t.expiredAt, t.revokedAt)', 'ASC')
        .limit(limit)
        .getRawMany<{ id: number }>();

      const deleteIds = ids.map((i) => i.id);

      if (deleteIds.length === 0) {
        return;
      }

      const result = await this.tokenRepository.delete(deleteIds);
      return result;
    } catch (error) {
      console.log('Error cleaning up expired tokens:', error);
      throw error;
    }
  }
}
