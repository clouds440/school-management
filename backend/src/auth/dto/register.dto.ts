import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';

export enum OrganizationType {
    HIGH_SCHOOL = 'HIGH_SCHOOL',
    UNIVERSITY = 'UNIVERSITY',
    PRIMARY_SCHOOL = 'PRIMARY_SCHOOL',
    OTHER = 'OTHER',
}

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsNotEmpty()
    location!: string;

    @IsEnum(OrganizationType)
    @IsNotEmpty()
    type!: OrganizationType;

    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    password!: string;
}
