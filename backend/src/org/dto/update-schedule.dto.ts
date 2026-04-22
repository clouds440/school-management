import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateScheduleDto } from './create-schedule.dto';

export class UpdateScheduleDto extends PartialType(CreateScheduleDto) {}
