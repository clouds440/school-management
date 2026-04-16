import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  replyToId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  mentionedUserIds?: string[];
}
