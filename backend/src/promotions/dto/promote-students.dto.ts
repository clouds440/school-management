import { IsString, IsNotEmpty, IsArray } from 'class-validator';

export class PromoteStudentsDto {
  @IsString()
  @IsNotEmpty()
  fromCycleId: string;

  @IsString()
  @IsNotEmpty()
  toCycleId: string;

  @IsString()
  @IsNotEmpty()
  toCohortId: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  studentIds: string[];
}
