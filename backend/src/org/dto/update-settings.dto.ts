import {
  IsString,
  IsOptional,
  IsEmail,
  IsObject,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
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
  @IsNotEmpty({ message: 'Organization name is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Location is required' })
  location: string;

  @IsEmail({}, { message: 'A valid contact email is required' })
  @IsNotEmpty({ message: 'Contact email is required' })
  contactEmail: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  phone: string;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => AccentColorDto)
  accentColor?: { primary?: string; secondary?: string };
}
