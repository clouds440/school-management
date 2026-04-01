import { IsString, IsOptional, IsUrl } from 'class-validator';

export class UpdateChatDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    avatarUrl?: string;
}
