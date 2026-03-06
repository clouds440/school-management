import { IsString, IsEmail, IsNotEmpty, IsOptional, IsNumber, MinLength, IsBoolean } from 'class-validator';

export class CreateTeacherDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
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
    isAdmin?: boolean;
}
