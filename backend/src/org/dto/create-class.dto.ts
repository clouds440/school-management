import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

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
    teacherId?: string;
}
