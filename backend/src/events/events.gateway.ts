import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { WsJwtGuard } from './ws-jwt.guard';

/**
 * Authenticated user data attached to socket.data.user by WsJwtGuard.
 */
interface SocketUser {
    id: string;
    role: string;
    name: string | null;
    email: string;
    organizationId: string | null;
}

/**
 * Single WebSocket gateway designed for future expansion.
 *
 * Current scope:  request:new, request:update, request:message
 * Future scope:   chat, notifications, announcements
 *
 * Room strategy:
 *   On connect → auto-join: user:{userId}, role:{role}, org:{orgId}
 *   On demand  → join: request:{id}, chat:{id}, section:{id}, etc.
 */
@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || '*',
        credentials: true,
    },
    namespace: '/',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    constructor(
        private readonly wsGuard: WsJwtGuard,
        private readonly configService: ConfigService,
    ) {}

    // ──────────────────────────── Connection lifecycle ──────────────────────────

    async handleConnection(client: Socket): Promise<void> {
        const isValid = await this.wsGuard.validateClient(client);

        if (!isValid) {
            client.emit('error', { message: 'Authentication failed' });
            client.disconnect(true);
            return;
        }

        const user = client.data.user as SocketUser;

        // Auto-join identity rooms
        await client.join(`user:${user.id}`);
        await client.join(`role:${user.role}`);

        if (user.organizationId) {
            await client.join(`org:${user.organizationId}`);
        }

        client.emit('connected', {
            userId: user.id,
            rooms: [`user:${user.id}`, `role:${user.role}`, ...(user.organizationId ? [`org:${user.organizationId}`] : [])],
        });
    }

    handleDisconnect(_client: Socket): void {
        // Socket.IO automatically cleans up room memberships on disconnect
    }

    // ──────────────────────────── Client-callable events ────────────────────────

    /**
     * Join a specific room (e.g., request:{id}, chat:{id}, section:{id}).
     */
    @SubscribeMessage('joinRoom')
    async handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string },
    ): Promise<void> {
        if (!client.data.user || !data?.roomId) return;
        await client.join(data.roomId);
        client.emit('roomJoined', { roomId: data.roomId });
    }

    /**
     * Leave a specific room.
     */
    @SubscribeMessage('leaveRoom')
    async handleLeaveRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string },
    ): Promise<void> {
        if (!client.data.user || !data?.roomId) return;
        await client.leave(data.roomId);
        client.emit('roomLeft', { roomId: data.roomId });
    }

    // ──────────────────────────── Emit helpers (for services) ───────────────────

    /**
     * Emit an event to a specific room.
     */
    emitToRoom(room: string, event: string, data: unknown): void {
        this.server.to(room).emit(event, data);
    }

    /**
     * Emit an event to a specific user by their userId.
     */
    emitToUser(userId: string, event: string, data: unknown): void {
        this.server.to(`user:${userId}`).emit(event, data);
    }

    /**
     * Emit an event to all users with a specific role.
     */
    emitToRole(role: string, event: string, data: unknown): void {
        this.server.to(`role:${role}`).emit(event, data);
    }

    /**
     * Emit an event to all users in an organization.
     */
    emitToOrg(orgId: string, event: string, data: unknown): void {
        this.server.to(`org:${orgId}`).emit(event, data);
    }
}
