import { IsString, IsOptional, IsArray, IsUUID } from 'class-validator';

export class CreateCourseMaterialDto {
  @IsUUID()
  sectionId: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  fileIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  links?: string[];
}
