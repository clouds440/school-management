import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { RequestStatus, Role } from '../common/enums';
import { getPaginationOptions, formatPaginatedResponse, PaginationOptions } from '../common/utils';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { CreateMessageDto } from './dto/create-message.dto';

/** Maximum active (non-resolved/closed) requests per user */
const MAX_ACTIVE_REQUESTS = 10;

/** Roles that can manage (view all, assign, change status) requests */
const ADMIN_ROLES = new Set([Role.SUPER_ADMIN, Role.PLATFORM_ADMIN]);

interface RequestUser {
    id: string;
    role: string;
    organizationId: string | null;
    name: string | null;
}

export interface ContactTarget {
    id: string;
    label: string;
    email?: string;
    type: 'USER' | 'ROLE';
    role: string;
    avatarUrl?: string | null;
    description?: string;
}

@Injectable()
export class RequestService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly events: EventsGateway,
    ) {}

    // ──────────────────────────────── Create ─────────────────────────────────

    async createRequest(dto: CreateRequestDto, user: RequestUser) {
        if (user.role === Role.STUDENT) {
            throw new ForbiddenException('Students are not allowed to submit requests.');
        }
        // Rate limiting: check active request count
        const activeCount = await this.prisma.request.count({
            where: {
                creatorId: user.id,
                status: { notIn: [RequestStatus.RESOLVED, RequestStatus.CLOSED] },
            },
        });

        if (activeCount >= MAX_ACTIVE_REQUESTS) {
            throw new BadRequestException(
                `You have reached the maximum of ${MAX_ACTIVE_REQUESTS} active requests. Please resolve or close existing requests first.`,
            );
        }

        // Create request + initial message + action log in a transaction
        const request = await this.prisma.$transaction(async (tx) => {
            const req = await tx.request.create({
                data: {
                    subject: dto.subject,
                    category: dto.category,
                    priority: dto.priority || 'NORMAL',
                    creatorId: user.id,
                    creatorRole: user.role,
                    organizationId: user.organizationId,
                    targetRole: dto.targetRole,
                    assigneeId: dto.assigneeIds?.[0], // For legacy compatibility/single field
                    assignees: dto.assigneeIds?.length ? {
                        connect: dto.assigneeIds.map(id => ({ id }))
                    } : undefined,
                    metadata: dto.metadata as Prisma.InputJsonValue ?? undefined,
                },
            });

            // Initial message
            await tx.requestMessage.create({
                data: {
                    requestId: req.id,
                    senderId: user.id,
                    content: dto.message,
                },
            });

            // Action log
            await tx.requestActionLog.create({
                data: {
                    requestId: req.id,
                    performedBy: user.id,
                    action: 'CREATED',
                    details: { category: dto.category, priority: dto.priority || 'NORMAL' },
                },
            });

            return req;
        });

        // Fetch the full request with relations for the response & event
        const fullRequest = await this.getRequestByIdInternal(request.id);

        // Emit to targeted role, assignee, or platform admins
        let targetRoom = `role:${Role.PLATFORM_ADMIN}`;
        if (dto.assigneeIds?.length) {
            targetRoom = `user:${dto.assigneeIds[0]}`;
        } else if (dto.targetRole) {
            targetRoom = `role:${dto.targetRole}`;
        }
        
        this.events.emitToRoom(targetRoom, 'request:new', fullRequest);

        // Also emit to super admins if not already targeted
        if (targetRoom !== `role:${Role.SUPER_ADMIN}`) {
            this.events.emitToRole(Role.SUPER_ADMIN, 'request:new', fullRequest);
        }

        // Notify all participants about unread count change
        this.emitUnreadUpdateToParticipants({
            creatorId: user.id,
            assigneeId: dto.assigneeIds?.[0] ?? null,
            targetRole: dto.targetRole ?? null,
        }, user.id);

        return fullRequest;
    }

    // ───────────────────────────────── List ──────────────────────────────────

    async getRequests(
        user: RequestUser,
        options: PaginationOptions & { status?: string; category?: string },
    ) {
        const { skip, take, search, sortBy, sortOrder } = getPaginationOptions({
            ...options,
            sortBy: options.sortBy || 'createdAt',
            sortOrder: options.sortOrder || 'desc',
        });

        const isAdmin = ADMIN_ROLES.has(user.role as Role);
 
        const where: Prisma.RequestWhereInput = {
            AND: [
                // Optional base filters
                ...(options.status ? [{ status: options.status as RequestStatus }] : []),
                ...(options.category ? [{ category: options.category }] : []),
                
                // Participation / Visibility Filter
                ...(isAdmin ? [] : [{
                    OR: [
                        { creatorId: user.id },
                        { assigneeId: user.id },
                        { assignees: { some: { id: user.id } } },
                        { targetRole: user.role as Role },
                        // Organization admins see all requests in their Org
                        ...(user.role === Role.ORG_ADMIN ? [{ organizationId: user.organizationId }] : []),
                        // Staff see requests targeted to ORG_STAFF
                        ...(user.role === Role.TEACHER || user.role === Role.ORG_MANAGER 
                            ? [{ targetRole: 'ORG_STAFF' }] 
                            : [])
                    ]
                }]),

                // Search Filter
                ...(search ? [{
                    OR: [
                        { subject: { contains: search, mode: 'insensitive' as const } },
                        { category: { contains: search, mode: 'insensitive' as const } },
                        { creator: { name: { contains: search, mode: 'insensitive' as const } } },
                    ]
                }] : [])
            ]
        };

        const [requests, totalRecords] = await Promise.all([
            this.prisma.request.findMany({
                where,
                skip,
                take,
                orderBy: [
                    { status: 'asc' }, // open requests first
                    { [sortBy]: sortOrder } as Prisma.RequestOrderByWithRelationInput,
                ],
                include: {
                    creator: {
                        select: { id: true, name: true, email: true, role: true, avatarUrl: true },
                    },
                    assignee: {
                        select: { id: true, name: true, email: true, role: true },
                    },
                    assignees: {
                        select: { id: true, name: true, email: true, role: true, avatarUrl: true },
                    },
                    organization: {
                        select: { id: true, name: true, logoUrl: true },
                    },
                    _count: {
                        select: { messages: true },
                    },
                },
            }),
            this.prisma.request.count({ where }),
        ]);

        return formatPaginatedResponse(requests, totalRecords, options.page, options.limit);
    }

    // ──────────────────────────── Get Single ─────────────────────────────────

    private async getRequestByIdInternal(requestId: string) {
        const request = await this.prisma.request.findUnique({
            where: { id: requestId },
            include: {
                creator: {
                    select: { id: true, name: true, email: true, role: true, avatarUrl: true },
                },
                assignee: {
                    select: { id: true, name: true, email: true, role: true },
                },
                assignees: {
                    select: { id: true, name: true, email: true, role: true, avatarUrl: true },
                },
                organization: {
                    select: { id: true, name: true, logoUrl: true },
                },
                messages: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        sender: {
                            select: { id: true, name: true, email: true, role: true, avatarUrl: true },
                        },
                    },
                },
                actionLogs: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        performer: {
                            select: { id: true, name: true, role: true },
                        },
                    },
                },
                _count: { select: { messages: true } },
            },
        });

        if (!request) return null;

        // Optimized: Fetch all files for all messages in this request with a single query
        const messageIds = request.messages.map(m => m.id);
        const allFiles = await this.prisma.file.findMany({
            where: {
                entityType: 'REQUEST_MESSAGE',
                entityId: { in: messageIds },
            },
            select: {
                id: true,
                path: true,
                filename: true,
                mimeType: true,
                size: true,
                entityId: true,
            },
        });

        // Group files by messageId for easy lookup
        type FileRecord = typeof allFiles[number];
        const filesMap = allFiles.reduce<Record<string, FileRecord[]>>((acc, file) => {
            if (!acc[file.entityId]) acc[file.entityId] = [];
            acc[file.entityId].push(file);
            return acc;
        }, {});

        const messagesWithFiles = request.messages.map((msg) => ({
            ...msg,
            files: filesMap[msg.id] || [],
        }));

        return { ...request, messages: messagesWithFiles };
    }

    async getRequestById(requestId: string, user: RequestUser) {
        const request = await this.getRequestByIdInternal(requestId);

        if (!request) {
            throw new NotFoundException('Request not found');
        }

        // Permission check: creator, assignee (single or M2M), target role, or admin
        const isAdmin = ADMIN_ROLES.has(user.role as Role);
        const isCreator = request.creatorId === user.id;
        const isSingleAssignee = request.assigneeId === user.id;
        const isM2MAssignee = request.assignees?.some(a => a.id === user.id) ?? false;
        const isTargetRole = request.targetRole === user.role
            || (request.targetRole === 'ORG_STAFF' && (user.role === Role.TEACHER || user.role === Role.ORG_MANAGER));

        if (!isAdmin && !isCreator && !isSingleAssignee && !isM2MAssignee && !isTargetRole) {
            throw new ForbiddenException('You do not have access to this request');
        }

        // Mark as read when viewed
        await this.markAsRead(requestId, user.id);

        return request;
    }

    // ──────────────────────────── Update ─────────────────────────────────────

    async updateRequest(
        requestId: string,
        dto: UpdateRequestDto,
        user: RequestUser,
    ) {
        const existing = await this.prisma.request.findUnique({
            where: { id: requestId },
        });

        if (!existing) {
            throw new NotFoundException('Request not found');
        }

        // Permission: only admins or the assignee can update
        const isAdmin = ADMIN_ROLES.has(user.role as Role);
        const isAssignee = existing.assigneeId === user.id;
        const isCreator = existing.creatorId === user.id;

        if (!isAdmin && !isAssignee && !isCreator) {
            throw new ForbiddenException('You do not have permission to update this request');
        }

        // Non-admins can only close their own requests
        if (!isAdmin && !isAssignee && isCreator) {
            if (dto.status && dto.status !== RequestStatus.CLOSED) {
                throw new ForbiddenException('You can only close your own requests');
            }
            if (dto.assigneeId || dto.priority) {
                throw new ForbiddenException('You do not have permission to change assignment or priority');
            }
        }

        const updateData: Prisma.RequestUpdateInput = {};
        const logDetails: Record<string, unknown> = {};

        if (dto.status && dto.status !== existing.status) {
            updateData.status = dto.status as RequestStatus;
            logDetails.statusFrom = existing.status;
            logDetails.statusTo = dto.status;
        }

        if (dto.assigneeId && dto.assigneeId !== existing.assigneeId) {
            // Verify assignee exists
            const assignee = await this.prisma.user.findUnique({
                where: { id: dto.assigneeId },
                select: { id: true },
            });
            if (!assignee) {
                throw new BadRequestException('Assignee user not found');
            }
            updateData.assignee = { connect: { id: dto.assigneeId } };
            logDetails.assigneeId = dto.assigneeId;
        }

        if (dto.priority && dto.priority !== existing.priority) {
            updateData.priority = dto.priority;
            logDetails.priorityFrom = existing.priority;
            logDetails.priorityTo = dto.priority;
        }

        if (Object.keys(updateData).length === 0) {
            return this.getRequestByIdInternal(requestId);
        }

        await this.prisma.$transaction(async (tx) => {
            await tx.request.update({
                where: { id: requestId },
                data: updateData,
            });

            const action = dto.status
                ? 'STATUS_CHANGED'
                : dto.assigneeId
                  ? 'ASSIGNED'
                  : 'UPDATED';

            await tx.requestActionLog.create({
                data: {
                    requestId,
                    performedBy: user.id,
                    action,
                    details: logDetails as Prisma.InputJsonValue,
                },
            });
        });

        const updated = await this.getRequestByIdInternal(requestId);

        // Emit update event (only if request still exists)
        if (updated) {
            this.events.emitToRoom(`request:${requestId}`, 'request:update', updated);
            this.events.emitToUser(existing.creatorId, 'request:update', updated);
        }

        return updated;
    }

    // ──────────────────────────── Add Message ────────────────────────────────

    async addMessage(
        requestId: string,
        dto: CreateMessageDto,
        user: RequestUser,
    ) {
        const request = await this.prisma.request.findUnique({
            where: { id: requestId },
        });

        if (!request) {
            throw new NotFoundException('Request not found');
        }

        // Permission: creator, assignee, or admin
        const isAdmin = ADMIN_ROLES.has(user.role as Role);
        const isCreator = request.creatorId === user.id;
        const isAssignee = request.assigneeId === user.id;

        if (!isAdmin && !isCreator && !isAssignee) {
            throw new ForbiddenException('You do not have permission to reply to this request');
        }

        // Cannot message on closed requests
        if (request.status === RequestStatus.CLOSED) {
            throw new BadRequestException('Cannot add messages to a closed request');
        }

        const [message] = await this.prisma.$transaction(async (tx) => {
            const msg = await tx.requestMessage.create({
                data: {
                    requestId,
                    senderId: user.id,
                    content: dto.content,
                },
                include: {
                    sender: {
                        select: { id: true, name: true, email: true, role: true, avatarUrl: true },
                    },
                },
            });

            await tx.requestActionLog.create({
                data: {
                    requestId,
                    performedBy: user.id,
                    action: 'MESSAGE_SENT',
                },
            });

            // Auto-update status if the request is awaiting response and someone else replies
            if (
                request.status === RequestStatus.AWAITING_RESPONSE &&
                request.creatorId !== user.id
            ) {
                await tx.request.update({
                    where: { id: requestId },
                    data: { status: RequestStatus.IN_PROGRESS },
                });
            } else if (
                request.status === RequestStatus.OPEN &&
                isAdmin
            ) {
                await tx.request.update({
                    where: { id: requestId },
                    data: { status: RequestStatus.IN_PROGRESS },
                });
            }

            return [msg];
        });

        // Emit message event to users watching this request thread
        this.events.emitToRoom(`request:${requestId}`, 'request:message', {
            ...message,
            requestId,
        });

        // Notify all participants that their unread count changed.
        // Use a single consolidated approach instead of multiple redundant queries.
        this.emitUnreadUpdateToParticipants(request, user.id);

        return message;
    }

    // ────────────────────────── Contactable Users ─────────────────────────────

    async getContactableUsers(user: RequestUser, search?: string): Promise<ContactTarget[]> {
        const role = user.role as Role;

        const targets: ContactTarget[] = [];
        
        const searchFilter: Prisma.UserWhereInput = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { teacherProfile: { is: { designation: { contains: search, mode: 'insensitive' } } } },
            ]
        } : {};

        // Helper to add users
        const addUsers = async (where: Prisma.UserWhereInput) => {
            const users = await this.prisma.user.findMany({
                where: { id: { not: user.id }, ...where, ...searchFilter },
                select: { 
                    id: true, 
                    name: true, 
                    email: true, 
                    role: true, 
                    avatarUrl: true, 
                    teacherProfile: { select: { designation: true } } 
                },
                take: 15,
            });
            users.forEach(u => {
                const profile = u.teacherProfile as { designation?: string } | null;
                targets.push({
                    id: u.id,
                    label: u.name || u.email,
                    email: u.email,
                    type: 'USER',
                    role: u.role,
                    avatarUrl: u.avatarUrl,
                    description: profile?.designation || u.role.replace('_', ' ')
                });
            });
        };

        if (role === Role.SUPER_ADMIN) {
            // Super Admin -> All/Single Platform Admin, All/Single Org Admin
            targets.push({ id: `ROLE:${Role.PLATFORM_ADMIN}`, label: 'All Platform Admins', type: 'ROLE', role: Role.PLATFORM_ADMIN });
            targets.push({ id: `ROLE:${Role.ORG_ADMIN}`, label: 'All Org Admins', type: 'ROLE', role: Role.ORG_ADMIN });
            await addUsers({ role: { in: [Role.PLATFORM_ADMIN, Role.ORG_ADMIN] } });
        } 
        else if (role === Role.PLATFORM_ADMIN) {
            // Platform Admin -> Super Admin, All/Single Org Admin
            targets.push({ id: `ROLE:${Role.ORG_ADMIN}`, label: 'All Org Admins', type: 'ROLE', role: Role.ORG_ADMIN });
            await addUsers({ role: { in: [Role.SUPER_ADMIN, Role.ORG_ADMIN] } });
        }
        else if (role === Role.ORG_ADMIN || role === Role.ORG_MANAGER) {
            // Org Admin/Manager -> All/Single Teachers, All/Single Managers, All Employees
            targets.push({ id: `ROLE:${Role.TEACHER}`, label: 'All Teachers', type: 'ROLE', role: Role.TEACHER });
            targets.push({ id: `ROLE:${Role.ORG_MANAGER}`, label: 'All Org Managers', type: 'ROLE', role: Role.ORG_MANAGER });
            targets.push({ id: `ROLE:ORG_STAFF`, label: 'All Employees (Teachers & Managers)', type: 'ROLE', role: 'ORG_STAFF' });
            
            if (role === Role.ORG_MANAGER) {
                // Org Manager can also contact Org Admin
                await addUsers({ organizationId: user.organizationId, role: Role.ORG_ADMIN });
            }
            
            await addUsers({ organizationId: user.organizationId, role: { in: [Role.TEACHER, Role.ORG_MANAGER] } });
            
            // Can also contact platform support
            targets.push({ id: 'ROLE:PLATFORM_ADMIN', label: 'Platform Administrative Team', type: 'ROLE', role: 'PLATFORM_ADMIN', description: 'Global Support & Administration' });
        }
        else if (role === Role.TEACHER) {
            // Teachers -> Single Org Manager, Single Fellow Teacher
            await addUsers({ organizationId: user.organizationId, role: { in: [Role.ORG_MANAGER, Role.TEACHER] } });
        }

        return targets;
    }

    // ─────────────────────────── Unread Tracking ─────────────────────────────

    async markAsRead(requestId: string, userId: string) {
        await this.prisma.requestUserView.upsert({
            where: {
                userId_requestId: { userId, requestId }
            },
            update: { lastViewedAt: new Date() },
            create: { userId, requestId, lastViewedAt: new Date() }
        });

        // Emit trigger for frontend to refresh unread count
        this.events.emitToUser(userId, 'unread:update', null);
    }

    /**
     * Count requests where the user is a participant AND there are messages
     * newer than the user's last view (or they've never viewed it).
     *
     * Uses a two-step Prisma approach instead of raw SQL:
     * Step 1: Build participation WHERE clause
     * Step 2: Count requests with unread messages via Prisma relations
     */
    async getUnreadCount(user: RequestUser): Promise<{ unread: number; total: number }> {
        const isAdmin = ADMIN_ROLES.has(user.role as Role);
        const isOrgStaff = user.role === Role.TEACHER || user.role === Role.ORG_MANAGER;

        // Build participation filter (same logic as getRequests)
        const participationFilter: Prisma.RequestWhereInput = isAdmin
            ? {}
            : {
                OR: [
                    { creatorId: user.id },
                    { assigneeId: user.id },
                    { assignees: { some: { id: user.id } } },
                    { targetRole: user.role },
                    ...(isOrgStaff ? [{ targetRole: 'ORG_STAFF' as const }] : []),
                ],
            };

        // Total count (active only, or all? Usually we count non-closed for unread, 
        // but "total" usually means total active/eligible messages).
        // Let's count all eligible requests that the user participates in and aren't resolved/closed.
        const totalCount = await this.prisma.request.count({
            where: {
                ...participationFilter,
                status: { notIn: [RequestStatus.RESOLVED, RequestStatus.CLOSED] },
            }
        });

        // Fetch user's view timestamps for all relevant requests in one query
        const userViews = await this.prisma.requestUserView.findMany({
            where: { userId: user.id },
            select: { requestId: true, lastViewedAt: true },
        });
        const viewMap = new Map(userViews.map(v => [v.requestId, v.lastViewedAt]));

        // Count requests that are active, the user participates in, and have unread messages.
        // 1. Requests the user has NEVER viewed (but have at least one message)
        const neverViewedCount = await this.prisma.request.count({
            where: {
                ...participationFilter,
                status: { notIn: [RequestStatus.RESOLVED, RequestStatus.CLOSED] },
                messages: { some: {} },
                userViews: { none: { userId: user.id } },
            },
        });

        // 2. Requests the user HAS viewed — check if any message is newer than their view.
        if (viewMap.size === 0) {
            return { unread: neverViewedCount, total: totalCount };
        }

        const viewedRequestIds = Array.from(viewMap.keys());
        const viewedRequests = await this.prisma.request.findMany({
            where: {
                id: { in: viewedRequestIds },
                ...participationFilter,
                status: { notIn: [RequestStatus.RESOLVED, RequestStatus.CLOSED] },
            },
            select: {
                id: true,
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { createdAt: true },
                },
            },
        });

        let viewedUnreadCount = 0;
        for (const req of viewedRequests) {
            const lastMessage = req.messages[0];
            const lastViewed = viewMap.get(req.id);
            if (lastMessage && lastViewed && lastMessage.createdAt > lastViewed) {
                viewedUnreadCount++;
            }
        }

        return { unread: neverViewedCount + viewedUnreadCount, total: totalCount };
    }

    // ─────────────────── WebSocket Notification Helpers ───────────────────────

    /**
     * Emit `unread:update` to all participants of a request.
     * Used after new messages or status updates.
     */
    private emitUnreadUpdateToParticipants(
        request: { creatorId: string; assigneeId: string | null; targetRole: string | null },
        excludeUserId?: string,
    ) {
        // 1. Creator
        if (request.creatorId !== excludeUserId) {
            this.events.emitToUser(request.creatorId, 'unread:update', null);
        }

        // 2. Single assignee (legacy field)
        if (request.assigneeId && request.assigneeId !== excludeUserId) {
            this.events.emitToUser(request.assigneeId, 'unread:update', null);
        }

        // 3. Target role group (covers M2M assignees who are in these role rooms)
        if (request.targetRole) {
            this.events.emitToRole(request.targetRole, 'unread:update', null);
        }

        // 4. Platform admins & super admins always see all requests
        this.events.emitToRole(Role.SUPER_ADMIN, 'unread:update', null);
        this.events.emitToRole(Role.PLATFORM_ADMIN, 'unread:update', null);
    }
}
