import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
