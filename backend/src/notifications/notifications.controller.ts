import { Controller, Get, Patch, Param, UseGuards, Request, Query } from '@nestjs/common';
import { NotificationsService, CreateNotificationDto } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    async getUserNotifications(
        @Request() req: AuthenticatedRequest,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.notificationsService.getUserNotifications(
            req.user.id,
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 20
        );
    }

    @Patch('read-all')
    async markAllAsRead(@Request() req: AuthenticatedRequest) {
        return this.notificationsService.markAllAsRead(req.user.id);
    }

    @Patch(':id/read')
    async markAsRead(
        @Param('id') id: string,
        @Request() req: AuthenticatedRequest
    ) {
        return this.notificationsService.markAsRead(id, req.user.id);
    }
}
