import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CopyForwardDto {
  @IsString()
  @IsNotEmpty()
  fromCycleId: string;

  @IsString()
  @IsNotEmpty()
  toCycleId: string;

  @IsBoolean()
  @IsOptional()
  copySchedules?: boolean;

  @IsBoolean()
  @IsOptional()
  copyAssessments?: boolean;

  @IsBoolean()
  @IsOptional()
  copyMaterials?: boolean;
}
