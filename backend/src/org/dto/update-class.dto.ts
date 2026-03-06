import { IsString, IsOptional } from 'class-validator';

export class UpdateClassDto {
    @IsString()
    @IsOptional()
    name?: string;

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
