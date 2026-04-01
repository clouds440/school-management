import { Module, Global } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
    imports: [AuthModule],
    controllers: [NotificationsController],
    providers: [NotificationsService],
    exports: [NotificationsService], // Export so Requests/Assessments can trigger notifications
})
export class NotificationsModule {}
