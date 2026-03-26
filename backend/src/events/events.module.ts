import { Module, Global } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { WsJwtGuard } from './ws-jwt.guard';

@Global()
@Module({
    providers: [EventsGateway, WsJwtGuard],
    exports: [EventsGateway],
})
export class EventsModule {}
