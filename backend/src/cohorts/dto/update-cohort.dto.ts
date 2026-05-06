import { IsString, IsOptional, IsArray } from 'class-validator';

export class UpdateCohortDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  studentIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sectionIds?: string[];
}
