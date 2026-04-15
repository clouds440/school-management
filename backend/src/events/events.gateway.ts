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
import { PrismaService } from '../prisma/prisma.service';

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
 * Current scope:  mail:new, mail:update, mail:message
 * Future scope:   chat, notifications, announcements
 *
 * Room strategy:
 *   On connect → auto-join: user:{userId}, role:{role}, org:{orgId}
 *   On demand  → join: mail:{id}, chat:{id}, section:{id}, etc.
 */
@WebSocketGateway({
  cors: {
    origin:
      (process.env.FRONTEND_URL || '')
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean).length > 0
        ? (process.env.FRONTEND_URL || '')
            .split(',')
            .map((url) => url.trim())
            .filter(Boolean)
        : '*',
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
    private readonly prisma: PrismaService,
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
      rooms: [
        `user:${user.id}`,
        `role:${user.role}`,
        ...(user.organizationId ? [`org:${user.organizationId}`] : []),
      ],
    });
  }

  handleDisconnect(): void {
    // Socket.IO automatically cleans up room memberships on disconnect
  }

  // ──────────────────────────── Client-callable events ────────────────────────

  /**
   * Join a specific room (e.g., mail:{id}, chat:{id}, section:{id}).
   */
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ): Promise<void> {
    if (!client.data.user || !data?.roomId) return;

    const user = client.data.user as SocketUser;

    // Security: For chat rooms, verify active participation
    if (data.roomId.startsWith('chat:')) {
      const chatId = data.roomId.replace('chat:', '');
      const participant = await this.prisma.chatParticipant.findUnique({
        where: { chatId_userId: { chatId, userId: user.id } },
      });

      if (!participant || !participant.isActive) {
        // Silently ignore or emit error
        client.emit('error', { message: 'Join room unauthorized' });
        return;
      }
    }

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

  /**
   * Force a specific user to leave a room (e.g., when they are removed from a chat).
   */
  async forceLeaveRoom(userId: string, roomId: string): Promise<void> {
    const userRoom = `user:${userId}`;
    const sockets = await this.server.in(userRoom).fetchSockets();

    for (const socket of sockets) {
      socket.leave(roomId);
      socket.emit('roomLeft', { roomId, forced: true });
    }
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
