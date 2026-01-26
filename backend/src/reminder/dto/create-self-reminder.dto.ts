import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSelfReminderDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsString()
  @MaxLength(1000)
  message: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  jobId?: string;

  @Type(() => Date)
  @IsDate()
  remindAt: Date;
}
