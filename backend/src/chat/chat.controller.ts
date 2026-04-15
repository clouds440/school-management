import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  Patch,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateDirectChatDto } from './dto/create-direct-chat.dto';
import { CreateGroupChatDto } from './dto/create-group.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { AddParticipantsDto } from './dto/add-participants.dto';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Patch(':id')
  async updateChat(
    @Param('id') id: string,
    @Body() dto: UpdateChatDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.chatService.updateChat(id, dto, {
      id: req.user.id,
      role: req.user.role,
      organizationId: req.user.organizationId,
    });
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: AuthenticatedRequest) {
    return this.chatService.getUnreadCount({
      id: req.user.id,
      role: req.user.role,
      organizationId: req.user.organizationId,
    });
  }

  @Get('users')
  async searchUsers(
    @Query('search') search: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.chatService.searchUsers(search || '', {
      id: req.user.id,
      role: req.user.role,
      organizationId: req.user.organizationId,
    });
  }

  @Post('direct')
  async createDirectChat(
    @Body() dto: CreateDirectChatDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.chatService.createDirectChat(dto, {
      id: req.user.id,
      role: req.user.role,
      organizationId: req.user.organizationId,
    });
  }

  @Post('group')
  async createGroupChat(
    @Body() dto: CreateGroupChatDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.chatService.createGroupChat(dto, {
      id: req.user.id,
      role: req.user.role,
      organizationId: req.user.organizationId,
    });
  }

  @Get()
  async getUserChats(@Request() req: AuthenticatedRequest) {
    return this.chatService.getUserChats({
      id: req.user.id,
      role: req.user.role,
      organizationId: req.user.organizationId,
    });
  }

  @Get(':id/messages')
  async getChatMessages(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('aroundId') aroundId?: string,
  ) {
    return this.chatService.getChatMessages(
      id,
      {
        id: req.user.id,
        role: req.user.role,
        organizationId: req.user.organizationId,
      },
      {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 50,
        aroundId,
      },
    );
  }

  @Post(':id/messages')
  async sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.chatService.sendMessage(id, dto, {
      id: req.user.id,
      role: req.user.role,
      organizationId: req.user.organizationId,
    });
  }

  @Patch([':id/read', ':id/read/:messageId'])
  async markAsRead(
    @Param('id') id: string,
    @Param('messageId') messageId?: string,
    @Request() req?: AuthenticatedRequest,
  ) {
    return this.chatService.markAsRead(id, messageId, {
      id: req!.user.id,
      role: req!.user.role,
      organizationId: req!.user.organizationId,
    });
  }

  @Post(':id/participants')
  async addParticipants(
    @Param('id') id: string,
    @Body() dto: AddParticipantsDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.chatService.addParticipants(id, dto, {
      id: req.user.id,
      role: req.user.role,
      organizationId: req.user.organizationId,
    });
  }

  @Post([':id/participants/:userId/remove', ':id/participants/remove/:userId'])
  async removeParticipant(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.chatService.removeParticipant(id, userId, {
      id: req.user.id,
      role: req.user.role,
      organizationId: req.user.organizationId,
    });
  }

  @Post([':id/messages/:messageId/delete', ':id/messages/delete/:messageId'])
  async deleteMessage(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.chatService.deleteMessage(id, messageId, {
      id: req.user.id,
      role: req.user.role,
      organizationId: req.user.organizationId,
    });
  }

  @Patch(':id/messages/:messageId')
  async editMessage(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @Body('content') content: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.chatService.editMessage(id, messageId, content, {
      id: req.user.id,
      role: req.user.role,
      organizationId: req.user.organizationId,
    });
  }
}
