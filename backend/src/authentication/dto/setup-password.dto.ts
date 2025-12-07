import { IsString, MinLength } from 'class-validator';

export class SetupPasswordDto {
  @IsString()
  @MinLength(8)
  password: string;
}
