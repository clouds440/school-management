import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSectionDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    semester?: string;

    @IsString()
    @IsOptional()
    year?: string;

    @IsString()
    @IsOptional()
    room?: string;

    @IsString()
    @IsNotEmpty()
    courseId: string;
}
