import { IsString, IsOptional, IsEmail, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AccentColorDto {
    @IsString()
    @IsOptional()
    primary?: string;

    @IsString()
    @IsOptional()
    secondary?: string;
}

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

    @IsObject()
    @IsOptional()
    @ValidateNested()
    @Type(() => AccentColorDto)
    accentColor?: { primary?: string; secondary?: string };
}

