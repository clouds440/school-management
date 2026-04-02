import { Module, Global } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { WsJwtGuard } from './ws-jwt.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
    imports: [PrismaModule],
    providers: [EventsGateway, WsJwtGuard],
    exports: [EventsGateway],
})
export class EventsModule {}
