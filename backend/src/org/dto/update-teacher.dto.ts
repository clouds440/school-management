import { IsString, IsOptional, IsNumber } from 'class-validator';

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
}
