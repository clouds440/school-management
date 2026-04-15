import { IsString, IsNotEmpty, IsArray } from 'class-validator';

export class CreateGroupChatDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsString({ each: true })
  participantIds: string[];
}
