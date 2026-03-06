import { IsString, IsEmail, IsNotEmpty, IsOptional, IsNumber, MinLength, IsArray, ArrayMinSize } from 'class-validator';

export class CreateStudentDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
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
}
