import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

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
}
