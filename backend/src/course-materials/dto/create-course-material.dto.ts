import { IsString, IsOptional, IsArray, IsUUID, IsBoolean } from 'class-validator';

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

  @IsBoolean()
  @IsOptional()
  isVideoLink?: boolean;
}
