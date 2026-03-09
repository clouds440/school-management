import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

export class UpdatePlatformAdminDto {
    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    @MinLength(6)
    password?: string;

    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    phone?: string;
}
