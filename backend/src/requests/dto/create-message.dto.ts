import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateMessageDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(10000)
    content!: string;
}
