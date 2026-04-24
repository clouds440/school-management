import { Module } from '@nestjs/common';
import { SectionsService } from './sections.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AttendanceModule } from '../attendance/attendance.module';

@Module({
  imports: [PrismaModule, AttendanceModule],
  providers: [SectionsService],
  exports: [SectionsService],
})
export class SectionsModule {}
