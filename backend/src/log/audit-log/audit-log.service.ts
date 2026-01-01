import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLogAction } from '../enums/audit-log.enum';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { PaginationDto } from '@/src/common/dtos/pagination.dto';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  validateIp(ip: string): boolean {
    const ipv4Regex =
      /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

    return ipv4Regex.test(ip);
  }

  async create(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
    if (
      createAuditLogDto.action === AuditLogAction.CREATE &&
      !createAuditLogDto.newValue
    ) {
      throw new BadRequestException('newValue is required for CREATE');
    }
    if (
      createAuditLogDto.action === AuditLogAction.DELETE &&
      !createAuditLogDto.oldValue
    ) {
      throw new BadRequestException('oldValue is required for DELETE');
    }
    if (
      createAuditLogDto.action === AuditLogAction.UPDATE &&
      (!createAuditLogDto.oldValue || !createAuditLogDto.newValue)
    ) {
      throw new BadRequestException(
        'oldValue & newValue are required for UPDATE',
      );
    }

    if (createAuditLogDto.ip) this.validateIp(createAuditLogDto.ip);

    const log = this.auditLogRepo.create({
      ...createAuditLogDto,
      actor: { id: createAuditLogDto.actorId },
    });

    return this.auditLogRepo.save(log);
  }

  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<{ auditLogs: AuditLog[]; total: number }> {
    const queryBuilder = this.auditLogRepo
      .createQueryBuilder('pr')
      .addSelect(['pr.createdAt'])
      .orderBy('pr.createdAt', 'DESC');

    if (
      paginationDto?.page !== undefined &&
      paginationDto?.limit !== undefined
    ) {
      const { page, limit } = paginationDto;

      queryBuilder.skip(page * limit).take(limit);
    }

    const [auditLogs, total] = await queryBuilder.getManyAndCount();

    return { auditLogs, total };
  }

  async findOne(id: number): Promise<AuditLog> {
    const log = await this.auditLogRepo.findOne({
      where: { id },
      relations: ['actor'],
    });

    if (!log) throw new NotFoundException('Log not found');

    return log;
  }
}
