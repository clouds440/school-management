import { Module } from '@nestjs/common';
import { OrgController } from './org.controller';
import { OrgService } from './org.service';
import { RemindersService } from './reminders.service';
import { FilesModule } from '../files/files.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StudentModule } from '../students/student.module';

@Module({
  imports: [FilesModule, NotificationsModule, StudentModule],
  controllers: [OrgController],
  providers: [OrgService, RemindersService],
})
export class OrgModule {}
