import { Module } from '@nestjs/common';
import { StudentService } from './student.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UserModule } from '../users/user.module';

import { StudentController } from './student.controller';

@Module({
  imports: [PrismaModule, NotificationsModule, UserModule],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}
