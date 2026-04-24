import { Module } from '@nestjs/common';
import { CourseMaterialsController } from './course-materials.controller';
import { CourseMaterialsService } from './course-materials.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FilesModule } from '../files/files.module';
import { StudentModule } from '../students/student.module';
import { SectionsModule } from '../sections/sections.module';

@Module({
  imports: [PrismaModule, NotificationsModule, FilesModule, StudentModule, SectionsModule],
  controllers: [CourseMaterialsController],
  providers: [CourseMaterialsService],
  exports: [CourseMaterialsService],
})
export class CourseMaterialsModule {}
