import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateClassDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    grade?: string;

    @IsString()
    @IsOptional()
    major?: string;

    @IsString()
    @IsOptional()
    teacherId?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    courses?: string[];
}
