import { Module } from '@nestjs/common';
import { RequestController } from './requests.controller';
import { RequestService } from './requests.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    controllers: [RequestController],
    providers: [RequestService],
    exports: [RequestService],
})
export class RequestsModule {}
