import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSectionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  room?: string;

  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  academicCycleId: string;

  @IsString()
  @IsOptional()
  cohortId?: string;
}
