import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';

export class EnrollStudentDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    sectionIds: string[];
}
