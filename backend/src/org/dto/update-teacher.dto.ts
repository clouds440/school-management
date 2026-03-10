import { IsString, IsOptional, IsNumber, IsDateString, IsArray, IsEnum } from 'class-validator';
import { TeacherStatus } from '@prisma/client';

export class UpdateTeacherDto {
    @IsNumber()
    @IsOptional()
    salary?: number;

    @IsString()
    @IsOptional()
    subject?: string;

    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    education?: string;

    @IsString()
    @IsOptional()
    designation?: string;

    @IsString()
    @IsOptional()
    department?: string;

    @IsDateString()
    @IsOptional()
    joiningDate?: string;

    @IsString()
    @IsOptional()
    emergencyContact?: string;

    @IsString()
    @IsOptional()
    bloodGroup?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    sectionIds?: string[];

    @IsEnum(TeacherStatus)
    @IsOptional()
    status?: TeacherStatus;
}
