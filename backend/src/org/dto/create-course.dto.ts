import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCourseDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;
}
