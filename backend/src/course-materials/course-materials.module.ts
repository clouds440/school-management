import { Module } from '@nestjs/common';
import { CourseMaterialsController } from './course-materials.controller';
import { CourseMaterialsService } from './course-materials.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [PrismaModule, NotificationsModule, FilesModule],
  controllers: [CourseMaterialsController],
  providers: [CourseMaterialsService],
  exports: [CourseMaterialsService],
})
export class CourseMaterialsModule {}
