import { IsString, IsNotEmpty } from 'class-validator';

export class CreateDirectChatDto {
  @IsString()
  @IsNotEmpty()
  participantId: string;
}
