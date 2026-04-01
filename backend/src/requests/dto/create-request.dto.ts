import { IsString, IsOptional, IsNotEmpty, MaxLength, IsIn, IsEnum } from 'class-validator';
import { RequestStatus } from '../../common/enums';

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
    @IsEnum(RequestStatus)
    status?: RequestStatus;

    @IsOptional()
    metadata?: Record<string, unknown>;

    @IsOptional()
    noReply?: boolean;
}
