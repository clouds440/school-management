import { IsString, IsOptional, IsNotEmpty, MaxLength, IsIn } from 'class-validator';

export class CreateRequestDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    subject!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    category!: string;

    @IsString()
    @IsOptional()
    @IsIn(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
    priority?: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(10000)
    message!: string;

    @IsString()
    @IsOptional()
    targetRole?: string;
    
    @IsString({ each: true })
    @IsOptional()
    assigneeIds?: string[];

    @IsOptional()
    metadata?: Record<string, unknown>;
}
