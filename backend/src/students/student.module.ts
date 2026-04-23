import { Module } from '@nestjs/common';
import { StudentService } from './student.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}
