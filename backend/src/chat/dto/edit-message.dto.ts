import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class EditMessageDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(5000)
    content: string;
}
