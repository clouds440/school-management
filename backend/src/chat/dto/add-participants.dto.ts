import { IsString, IsArray, ArrayNotEmpty } from 'class-validator';

export class AddParticipantsDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    participantIds: string[];
}
