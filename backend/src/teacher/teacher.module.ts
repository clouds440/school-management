import { Module } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { TeacherController } from './teacher.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UserModule } from '../users/user.module';
import { SectionsModule } from '../sections/sections.module';

@Module({
  imports: [PrismaModule, NotificationsModule, UserModule, SectionsModule],
  controllers: [TeacherController],
  providers: [TeacherService],
  exports: [TeacherService],
})
export class TeacherModule {}
