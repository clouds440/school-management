import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentDto } from './create-student.dto';
import { IsOptional, MinLength, Matches, ValidateIf } from 'class-validator';

export class UpdateStudentDto extends PartialType(CreateStudentDto) {
    @IsOptional()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    })
    @ValidateIf((o) => o.password !== '' && o.password !== undefined)
    password?: string;
}

