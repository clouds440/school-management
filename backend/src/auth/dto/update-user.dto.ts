import { IsOptional, IsIn } from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @IsIn(['LIGHT', 'DARK', 'SYSTEM'])
    themeMode?: 'LIGHT' | 'DARK' | 'SYSTEM';

    @IsOptional()
    name?: string;
}
