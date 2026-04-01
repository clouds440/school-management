import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@UseGuards(JwtAuthGuard)
@Controller('requests')
export class RequestController {
    constructor(private readonly requestService: RequestService) {}

    @Post()
    async create(
        @Body() dto: CreateRequestDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.requestService.createRequest(dto, {
            id: req.user.id,
            role: req.user.role,
            organizationId: req.user.organizationId,
            name: req.user.name,
            email: req.user.email,
        });
    }

    @Get('unread-count')
    async getUnreadCount(@Request() req: AuthenticatedRequest) {
        return this.requestService.getUnreadCount({
            id: req.user.id,
            role: req.user.role,
            organizationId: req.user.organizationId,
            name: req.user.name,
            email: req.user.email,
        });
    }

    @Get()
    async findAll(
        @Request() req: AuthenticatedRequest,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'asc' | 'desc',
        @Query('status') status?: string,
        @Query('category') category?: string,
    ) {
        return this.requestService.getRequests(
            {
                id: req.user.id,
                role: req.user.role,
                organizationId: req.user.organizationId,
                name: req.user.name,
                email: req.user.email,
            },
            {
                page: page ? parseInt(page, 10) : 1,
                limit: limit ? parseInt(limit, 10) : 10,
                search,
                sortBy,
                sortOrder,
                status,
                category,
            },
        );
    }

    @Get('contacts')
    async getContacts(
        @Request() req: AuthenticatedRequest,
        @Query('search') search?: string,
    ) {
        return this.requestService.getContactableUsers(
            {
                id: req.user.id,
                role: req.user.role,
                organizationId: req.user.organizationId,
                name: req.user.name,
                email: req.user.email,
            },
            search,
        );
    }

    @Get(':id')
    async findOne(
        @Param('id') id: string,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.requestService.getRequestById(id, {
            id: req.user.id,
            role: req.user.role,
            organizationId: req.user.organizationId,
            name: req.user.name,
            email: req.user.email,
        });
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateRequestDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.requestService.updateRequest(id, dto, {
            id: req.user.id,
            role: req.user.role,
            organizationId: req.user.organizationId,
            name: req.user.name,
            email: req.user.email,
        });
    }

    @Post(':id/messages')
    async addMessage(
        @Param('id') id: string,
        @Body() dto: CreateMessageDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.requestService.addMessage(id, dto, {
            id: req.user.id,
            role: req.user.role,
            organizationId: req.user.organizationId,
            name: req.user.name,
            email: req.user.email,
        });
    }
}
