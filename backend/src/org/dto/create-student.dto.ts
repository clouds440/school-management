import { IsString, IsEmail, IsNotEmpty, IsOptional, IsNumber, MinLength, Matches, IsDateString } from 'class-validator';

export class CreateStudentDto {
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
    name: string;

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

    @IsString()
    @IsOptional()
    classId?: string;

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
}
