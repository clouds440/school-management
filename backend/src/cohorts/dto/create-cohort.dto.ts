import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class CreateCohortDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  academicCycleId: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  studentIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sectionIds?: string[];
}
