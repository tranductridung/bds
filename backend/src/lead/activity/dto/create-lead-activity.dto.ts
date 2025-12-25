import {
  IsEnum,
  IsNumber,
  IsObject,
  IsString,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import {
  LeadActivityAction,
  LeadActivityResource,
} from '../../enums/lead.enum';
import { Type } from 'class-transformer';
import { ActivityValue } from './../../types/activity-json.type';

export class CreateLeadActivityDto {
  @IsNotEmpty()
  @IsEnum(LeadActivityAction)
  action: LeadActivityAction;

  @IsNotEmpty()
  @IsEnum(LeadActivityResource)
  resource: LeadActivityResource;

  @IsOptional()
  @IsObject()
  oldValue?: ActivityValue;

  @IsOptional()
  @IsObject()
  newValue?: ActivityValue;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  performedById: number;

  @Type(() => Number)
  @IsNumber()
  resourceId: number;
}
