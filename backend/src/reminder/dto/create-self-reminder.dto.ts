import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSelfReminderDto {
  @ApiProperty({
    description: 'Title of the reminder',
    example: 'Follow up with client about property viewing',
  })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiProperty({
    description: 'Message for the reminder',
    example:
      "Don't forget to follow up with the client about the property viewing.",
    maxLength: 1000,
  })
  @IsString()
  @MaxLength(1000)
  message!: string;

  @ApiProperty({
    description: 'ID of the job associated with the reminder',
    example: 'job-123',
    required: false,
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  jobId?: string;

  @ApiProperty({
    description: 'Date and time when the reminder should be triggered',
    example: '2023-10-15T10:00:00Z',
  })
  @Type(() => Date)
  @IsDate()
  remindAt!: Date;
}
