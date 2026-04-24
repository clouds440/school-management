import { Module } from '@nestjs/common';
import { SectionsService } from './sections.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CoursesModule } from '../courses/courses.module';

@Module({
  imports: [PrismaModule, CoursesModule],
  providers: [SectionsService],
  exports: [SectionsService],
})
export class SectionsModule {}
