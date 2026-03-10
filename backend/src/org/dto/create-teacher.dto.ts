import { IsString, IsEmail, IsNotEmpty, IsOptional, IsNumber, MinLength, IsBoolean, Matches, IsDateString, IsArray, IsEnum } from 'class-validator';
import { TeacherStatus } from '@prisma/client';

export class CreateTeacherDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    })
    password: string;

    @IsString()
    @IsNotEmpty()
    name: string; // Used for general info if needed by user schema

    @IsNumber()
    @IsOptional()
    salary?: number;

    @IsString()
    @IsOptional()
    subject?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    education?: string;

    @IsString()
    @IsOptional()
    designation?: string;

    @IsBoolean()
    @IsOptional()
    isManager?: boolean;

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
