import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { Prisma } from '@prisma/client';

export interface CreateNotificationDto {
    userId: string;
    title: string;
    body?: string;
    actionUrl?: string;
    type?: string;
    metadata?: Prisma.JsonValue;
}

@Injectable()
export class NotificationsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly events: EventsGateway,
    ) {}

    async createNotification(dto: CreateNotificationDto) {
        const notification = await this.prisma.notification.create({
            data: {
                userId: dto.userId,
                title: dto.title,
                body: dto.body,
                actionUrl: dto.actionUrl,
                type: dto.type,
                metadata: dto.metadata as Prisma.InputJsonValue ?? null
            }
        });

        // Broadcast to user room
        this.events.emitToUser(dto.userId, 'notification:new', notification);

        return notification;
    }

    async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.notification.count({ where: { userId } })
        ]);

        const unreadCount = await this.prisma.notification.count({
            where: { userId, isRead: false }
        });

        return {
            data,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            unreadCount
        };
    }

    async markAsRead(notificationId: string, userId: string) {
        const notification = await this.prisma.notification.findUnique({
            where: { id: notificationId }
        });

        if (!notification) throw new NotFoundException('Notification not found');
        if (notification.userId !== userId) throw new NotFoundException('Notification not found');

        const updated = await this.prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true }
        });

        this.events.emitToUser(userId, 'notification:read', { notificationId });

        return updated;
    }

    async markAllAsRead(userId: string) {
        const result = await this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });

        this.events.emitToUser(userId, 'notification:read_all', {});

        return result;
    }
}
