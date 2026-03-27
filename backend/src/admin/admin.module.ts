import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminAuthController } from './admin-auth.controller';
import { AdminService } from './admin.service';
import { AuthModule } from '../auth/auth.module';
import { RequestsModule } from '../requests/requests.module';

@Module({
    imports: [AuthModule, RequestsModule],
    controllers: [AdminController, AdminAuthController],
    providers: [AdminService]
})
export class AdminModule { }
