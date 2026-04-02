import { IsString, IsOptional, IsIn, IsUUID } from 'class-validator';

export class UpdateMailDto {
    @IsString()
    @IsOptional()
    @IsIn(['OPEN', 'IN_PROGRESS', 'AWAITING_RESPONSE', 'RESOLVED', 'CLOSED'])
    status?: string;

    @IsString()
    @IsOptional()
    @IsUUID()
    assigneeId?: string;

    @IsString()
    @IsOptional()
    @IsIn(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
    priority?: string;
}
