import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class CreateSubmissionDto {
    @IsString()
    @IsNotEmpty()
    assessmentId: string;

    @IsString()
    @IsOptional()
    @IsUrl()
    fileUrl?: string;
}
