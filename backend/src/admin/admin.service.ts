import { UnauthorizedException, NotFoundException, Injectable } from '@nestjs/common';
import { Prisma, User as UserEntity } from '@prisma/client';
import { OrgStatus, Role, RequestStatus, RequestCategory } from '../common/enums';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { getPaginationOptions, formatPaginatedResponse, mapStatusCounts, PaginationOptions } from '../common/utils';
import { RequestService } from '../requests/requests.service';
import { RequestUser } from '../requests/interfaces/request-user.interface';

import { CreatePlatformAdminDto } from './dto/create-platform-admin.dto';
import { UpdatePlatformAdminDto } from './dto/update-platform-admin.dto';


@Injectable()
export class AdminService {
    constructor(
        private readonly authService: AuthService,
        private readonly prisma: PrismaService,
        private readonly requestService: RequestService
    ) { }

    async getOrganizations(options: PaginationOptions & {
        status?: OrgStatus;
        type?: string;
    }) {
        const { skip, take, sortBy, sortOrder } = getPaginationOptions({ ...options, sortBy: options.sortBy || 'createdAt', sortOrder: options.sortOrder || 'desc' });

        // Map frontend sort keys to Prisma fields
        let prismaSortBy = sortBy;
        if (sortBy === 'email' || sortBy === 'contact') {
            prismaSortBy = 'contactEmail';
        }

        const where: Prisma.OrganizationWhereInput = {
            ...(options.status ? { status: options.status } : {}),
            ...(options.type && options.type !== 'ALL' ? { type: options.type } : {}),
            ...(options.search ? {
                OR: [
                    { name: { contains: options.search, mode: 'insensitive' } },
                    { location: { contains: options.search, mode: 'insensitive' } },
                    { type: { contains: options.search, mode: 'insensitive' } },
                ]
            } : {})
        };

        // For dynamic counts based on SEARCH and TYPE but NOT on status
        const countWhere: Prisma.OrganizationWhereInput = {
            ...(options.type && options.type !== 'ALL' ? { type: options.type } : {}),
            ...(options.search ? {
                OR: [
                    { name: { contains: options.search, mode: 'insensitive' } },
                    { location: { contains: options.search, mode: 'insensitive' } },
                    { type: { contains: options.search, mode: 'insensitive' } },
                ]
            } : {})
        };

        const [orgs, totalRecords, statusCounts] = await Promise.all([
            this.prisma.organization.findMany({
                where,
                skip,
                take,
                orderBy: { [prismaSortBy]: sortOrder } as Prisma.OrganizationOrderByWithRelationInput,
                include: {
                    users: {
                        where: { role: Role.ORG_ADMIN },
                        select: { id: true },
                        take: 1
                    }
                }
            }),
            this.prisma.organization.count({ where }),
            this.prisma.organization.groupBy({
                by: ['status'],
                where: countWhere,
                _count: { _all: true }
            })
        ]);

        const countsMap = mapStatusCounts(statusCounts, OrgStatus);

        const mappedData = orgs.map(org => ({
            id: org.id,
            name: org.name,
            logoUrl: org.logoUrl,
            location: org.location,
            type: org.type,
            status: org.status,
            statusHistory: org.statusHistory,
            createdAt: org.createdAt,
            phone: org.phone,
            email: org.contactEmail,
            adminUserId: (org as any).users?.[0]?.id
        }));

        const response = formatPaginatedResponse(mappedData, totalRecords, options.page, options.limit);
        return {
            ...response,
            counts: countsMap
        };
    }

    async approveOrganization(id: string, admin: UserEntity) {
        const org = await this.prisma.organization.findUnique({ where: { id } });
        if (!org) {
            throw new NotFoundException('Organization not found');
        }

        const history = (org.statusHistory as Prisma.JsonArray) || [];
        const newEntry = {
            status: OrgStatus.APPROVED,
            message: 'Organization approved.',
            adminName: admin.name || admin.email,
            adminRole: admin.role,
            createdAt: new Date()
        };

        const result = await this.prisma.organization.update({
            where: { id },
            data: {
                status: OrgStatus.APPROVED,
                statusHistory: [...history, newEntry] as Prisma.InputJsonValue
            }
        });

        // Find the admin user to send the welcome mail
        const orgAdmin = await this.prisma.user.findFirst({
            where: { organizationId: id, role: Role.ORG_ADMIN }
        });

        if (orgAdmin) {
            // Send NO_REPLY welcome mail
            await this.requestService.createRequest({
                subject: `Welcome to EduManage: ${org.name}`,
                category: RequestCategory.PLATFORM_NOTICE,
                priority: 'NORMAL',
                message: `Congratulations! Your organization **${org.name}** has been approved. You now have full access to your dashboard.\n\nWelcome to the EduManage community!`,
                assigneeIds: [orgAdmin.id],
            }, { id: admin.id, role: admin.role, name: admin.name, email: admin.email, organizationId: undefined } as any, true); // true for noReply
        }

        return result;
    }



    async rejectOrganization(id: string, reason: string, admin: UserEntity) {
        const org = await this.prisma.organization.findUnique({ where: { id } });
        if (!org) {
            throw new NotFoundException('Organization not found');
        }

        const history = (org.statusHistory as Prisma.JsonArray) || [];
        const newEntry = {
            status: OrgStatus.REJECTED,
            message: reason,
            adminName: admin.name || admin.email,
            adminRole: admin.role,
            createdAt: new Date()
        };

        const result = await this.prisma.$transaction(async (tx) => {
            // 1. Update status and history
            const updatedOrg = await tx.organization.update({
                where: { id },
                data: {
                    status: OrgStatus.REJECTED,
                    statusHistory: [...history, newEntry] as Prisma.InputJsonValue
                }
            });

            // 2. Find any admin user of this organization to be the target of the mail
            const orgAdmin = await tx.user.findFirst({
                where: { organizationId: id, role: Role.ORG_ADMIN }
            });

            // 3. Create a Request thread (Notice)
            const request = await tx.request.create({
                data: {
                    subject: 'Application Status Update: REJECTED',
                    category: 'System Notice',
                    priority: 'URGENT',
                    status: RequestStatus.OPEN,
                    creatorId: admin.id,
                    creatorRole: admin.role,
                    organizationId: id,
                    targetRole: Role.ORG_ADMIN,
                    assigneeId: orgAdmin?.id,
                }
            });

            // 4. Initial Message
            await tx.requestMessage.create({
                data: {
                    requestId: request.id,
                    senderId: admin.id,
                    content: reason
                }
            });

            // 5. Mark as read for the admin (sender)
            await tx.requestUserView.create({
                data: {
                    userId: admin.id,
                    requestId: request.id,
                    lastViewedAt: new Date()
                }
            });

            return updatedOrg;
        });

        return result;
    }


    async suspendOrganization(id: string, reason: string, admin: UserEntity) {
        const org = await this.prisma.organization.findUnique({ where: { id } });
        if (!org) {
            throw new NotFoundException('Organization not found');
        }

        const history = (org.statusHistory as Prisma.JsonArray) || [];
        const newEntry = {
            status: OrgStatus.SUSPENDED,
            message: reason,
            adminName: admin.name || admin.email,
            adminRole: admin.role,
            createdAt: new Date()
        };

        const result = await this.prisma.$transaction(async (tx) => {
            // 1. Update status and history
            const updatedOrg = await tx.organization.update({
                where: { id },
                data: {
                    status: OrgStatus.SUSPENDED,
                    statusHistory: [...history, newEntry] as Prisma.InputJsonValue,
                },
            });

            // 2. Find any admin user of this organization to be the target of the mail
            const orgAdmin = await tx.user.findFirst({
                where: { organizationId: id, role: Role.ORG_ADMIN }
            });

            // 3. Create a Request thread (Notice)
            const request = await tx.request.create({
                data: {
                    subject: 'Organization Status Update: SUSPENDED',
                    category: 'Security/Admin Notice',
                    priority: 'URGENT',
                    status: RequestStatus.OPEN,
                    creatorId: admin.id,
                    creatorRole: admin.role,
                    organizationId: id,
                    targetRole: Role.ORG_ADMIN,
                    assigneeId: orgAdmin?.id,
                }
            });

            // 4. Initial Message
            await tx.requestMessage.create({
                data: {
                    requestId: request.id,
                    senderId: admin.id,
                    content: reason
                }
            });

            // 5. Mark as read for the admin (sender)
            await tx.requestUserView.create({
                data: {
                    userId: admin.id,
                    requestId: request.id,
                    lastViewedAt: new Date()
                }
            });

            return updatedOrg;
        });

        return result;
    }


    async getAdminStats(user: RequestUser) {
        const [orgStatusCounts, unreadMail, platformAdmins] = await Promise.all([
            this.prisma.organization.groupBy({
                by: ['status'],
                _count: { _all: true }
            }),
            this.requestService.getUnreadCount(user),
            this.prisma.user.count({ where: { role: Role.PLATFORM_ADMIN } }),
        ]);

        const orgCounts = mapStatusCounts(orgStatusCounts, OrgStatus);

        return {
            ...orgCounts,
            UNREAD_MAIL: unreadMail.unread,
            TOTAL_MAIL: unreadMail.total,
            PLATFORM_ADMINS: platformAdmins
        };
    }

    // --- Platform Admins ---
    async getPlatformAdmins(options: PaginationOptions) {
        const { skip, take, search } = getPaginationOptions(options);

        const where: Prisma.UserWhereInput = {
            role: Role.PLATFORM_ADMIN,
            ...(search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } }
                ]
            } : {})
        };

        const [admins, totalRecords] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take,
                select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
                orderBy: { createdAt: 'desc' }
            }),
            this.prisma.user.count({ where })
        ]);

        return formatPaginatedResponse(admins, totalRecords, options.page, options.limit);
    }

    async createPlatformAdmin(data: CreatePlatformAdminDto) {
        const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
        if (existing) throw new UnauthorizedException('Email already in use');

        const hashedPassword = await bcrypt.hash(data.password, 10);
        return this.prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                phone: data.phone,
                role: Role.PLATFORM_ADMIN,
            },
            select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true }
        });
    }

    async updatePlatformAdmin(id: string, data: UpdatePlatformAdminDto) {
        const admin = await this.prisma.user.findUnique({ where: { id, role: Role.PLATFORM_ADMIN } });
        if (!admin) throw new NotFoundException('Platform admin not found');

        const updateData: Prisma.UserUpdateInput = {};
        if (data.name) updateData.name = data.name;
        if (data.email) updateData.email = data.email;
        if (data.phone) updateData.phone = data.phone;
        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        return this.prisma.user.update({
            where: { id },
            data: updateData,
            select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true }
        });
    }

    async deletePlatformAdmin(id: string) {
        const admin = await this.prisma.user.findUnique({ where: { id, role: Role.PLATFORM_ADMIN } });
        if (!admin) throw new NotFoundException('Platform admin not found');

        await this.prisma.user.delete({ where: { id } });
        return { message: 'Platform admin deleted successfully' };
    }



    async changeAdminPassword(userId: string, oldPass: string, newPass: string) {

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || (user.role !== Role.SUPER_ADMIN && user.role !== Role.PLATFORM_ADMIN)) {
            throw new UnauthorizedException('Admin not found');
        }

        const isMatch = await bcrypt.compare(oldPass, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Incorrect old password');
        }

        const hashedNew = await bcrypt.hash(newPass, 10);
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedNew,
                isFirstLogin: false
            }
        });

        return this.authService.generateToken(updatedUser);
    }
}
