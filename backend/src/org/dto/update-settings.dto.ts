import { IsString, IsOptional, IsEmail, IsNotEmpty } from 'class-validator';

export class UpdateSettingsDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    location?: string;

    @IsEmail()
    @IsOptional()
    contactEmail?: string;

    @IsString()
    @IsOptional()
    phone?: string;
}
