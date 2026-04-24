import { Module } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StudentModule } from '../students/student.module';

@Module({
  imports: [PrismaModule, NotificationsModule, StudentModule],
  providers: [AssessmentsService],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}
