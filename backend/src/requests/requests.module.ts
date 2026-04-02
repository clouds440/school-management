import { Module } from '@nestjs/common';
import { MailController } from './requests.controller';
import { MailService } from './requests.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    controllers: [MailController],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule {}
