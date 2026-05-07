import { IsString, IsOptional } from 'class-validator';

export class UpdateSectionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  room?: string;

  @IsString()
  @IsOptional()
  courseId?: string;

  @IsString()
  @IsOptional()
  cohortId?: string;

  @IsString()
  @IsOptional()
  academicCycleId?: string;
}
