import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateChatDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsBoolean()
  readOnly?: boolean;
}
