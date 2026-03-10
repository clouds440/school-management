import { IsString, IsOptional, IsNumber, IsArray, IsDateString, IsEnum } from 'class-validator';
import { StudentStatus } from '@prisma/client';

export class UpdateStudentDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    registrationNumber?: string;

    @IsString()
    @IsOptional()
    fatherName?: string;

    @IsNumber()
    @IsOptional()
    fee?: number;

    @IsNumber()
    @IsOptional()
    age?: number;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    major?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    sectionIds?: string[];

    @IsString()
    @IsOptional()
    department?: string;

    @IsDateString()
    @IsOptional()
    admissionDate?: string;

    @IsDateString()
    @IsOptional()
    graduationDate?: string;

    @IsString()
    @IsOptional()
    emergencyContact?: string;

    @IsString()
    @IsOptional()
    bloodGroup?: string;

    @IsString()
    @IsOptional()
    gender?: string;

    @IsString()
    @IsOptional()
    feePlan?: string;

    @IsEnum(StudentStatus)
    @IsOptional()
    status?: StudentStatus;
}
