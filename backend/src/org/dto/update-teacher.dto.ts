import { PartialType } from '@nestjs/mapped-types';
import { CreateTeacherDto } from './create-teacher.dto';
import {
  IsOptional,
  MinLength,
  Matches,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';

export class UpdateTeacherDto extends PartialType(CreateTeacherDto) {
  @IsOptional()
  @IsNotEmpty()
  salary?: number;

  @IsOptional()
  @IsNotEmpty()
  subject?: string;

  @IsOptional()
  @IsNotEmpty()
  phone?: string;

  @IsOptional()
  @IsNotEmpty()
  education?: string;

  @IsOptional()
  @IsNotEmpty()
  designation?: string;

  @IsOptional()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  @ValidateIf((o) => o.password !== '' && o.password !== undefined)
  password?: string;
}
