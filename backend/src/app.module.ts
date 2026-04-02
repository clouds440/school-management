import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { OrgModule } from './org/org.module';
import { FilesModule } from './files/files.module';
import { PrismaModule } from './prisma/prisma.module';
import { EventsModule } from './events/events.module';
import { MailModule } from './mail/mail.module';

import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ChatModule } from './chat/chat.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ActiveOrgGuard } from './common/guards/active-org.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    AuthModule,
    AdminModule,
    OrgModule,
    FilesModule,
    PrismaModule,
    EventsModule,
    MailModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 300,
    }]),
    ChatModule,
    NotificationsModule,
    AnnouncementsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ActiveOrgGuard,
    },
  ],
})
export class AppModule { }
