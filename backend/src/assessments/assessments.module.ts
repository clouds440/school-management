import { Module } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StudentModule } from '../students/student.module';
import { SectionsModule } from '../sections/sections.module';

@Module({
  imports: [PrismaModule, NotificationsModule, StudentModule, SectionsModule],
  providers: [AssessmentsService],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}
