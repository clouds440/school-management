import { UnauthorizedException, NotFoundException, Injectable } from '@nestjs/common';
import { Prisma, User as UserEntity } from '@prisma/client';
import { OrgStatus, Role, SupportTopic } from '../common/enums';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';

import { CreatePlatformAdminDto } from './dto/create-platform-admin.dto';
import { UpdatePlatformAdminDto } from './dto/update-platform-admin.dto';


@Injectable()
export class AdminService {
    constructor(
        private readonly authService: AuthService,
        private readonly prisma: PrismaService
    ) { }

    async getOrganizations(options: {
        status?: OrgStatus;
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        type?: string;
    }) {
        const {
            status,
            page = 1,
            limit = 10,
            search = '',
            sortBy = 'createdAt',
            sortOrder = 'desc',
            type = 'ALL'
        } = options;

        const skip = (page - 1) * limit;
        const take = limit;

        // Map frontend sort keys to Prisma fields
        let prismaSortBy = sortBy;
        if (sortBy === 'email' || sortBy === 'contact') {
            prismaSortBy = 'contactEmail';
        }

        const where: Prisma.OrganizationWhereInput = {
            ...(status ? { status } : {}),
            ...(type && type !== 'ALL' ? { type } : {}),
            ...(search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { location: { contains: search, mode: 'insensitive' } },
                    { type: { contains: search, mode: 'insensitive' } },
                ]
            } : {})
        };

        // For dynamic counts based on SEARCH and TYPE but NOT on status
        const countWhere: Prisma.OrganizationWhereInput = {
            ...(type && type !== 'ALL' ? { type } : {}),
            ...(search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { location: { contains: search, mode: 'insensitive' } },
                    { type: { contains: search, mode: 'insensitive' } },
                ]
            } : {})
        };

        const [orgs, totalRecords, pendingCount, approvedCount, rejectedCount, suspendedCount] = await Promise.all([
            this.prisma.organization.findMany({
                where,
                skip,
                take,
                orderBy: { [prismaSortBy]: sortOrder } as Prisma.OrganizationOrderByWithRelationInput,
                include: {
                    users: {
                        where: { role: Role.ORG_ADMIN },
                        select: { email: true },
                        take: 1
                    }
                }
            }),
            this.prisma.organization.count({ where }),
            this.prisma.organization.count({ where: { ...countWhere, status: OrgStatus.PENDING } }),
            this.prisma.organization.count({ where: { ...countWhere, status: OrgStatus.APPROVED } }),
            this.prisma.organization.count({ where: { ...countWhere, status: OrgStatus.REJECTED } }),
            this.prisma.organization.count({ where: { ...countWhere, status: OrgStatus.SUSPENDED } }),
        ]);

        const mappedData = orgs.map(org => ({
            id: org.id,
            name: org.name,
            logoUrl: org.logoUrl,
            location: org.location,
            type: org.type,
            status: org.status,
            statusHistory: org.statusHistory,
            createdAt: org.createdAt,
            email: org.users?.[0]?.email || 'No email'
        }));

        return {
            data: mappedData,
            totalRecords,
            totalPages: Math.ceil(totalRecords / limit),
            currentPage: page,
            counts: {
                PENDING: pendingCount,
                APPROVED: approvedCount,
                REJECTED: rejectedCount,
                SUSPENDED: suspendedCount
            }
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

        await this.prisma.organization.update({
            where: { id },
            data: {
                status: OrgStatus.APPROVED,
                statusHistory: [...history, newEntry] as Prisma.InputJsonValue
            }
        });

        // Resolve pending "Account status" tickets for this organization
        return this.prisma.supportTicket.updateMany({
            where: { organizationId: id, isResolved: false, topic: SupportTopic.ACCOUNT_STATUS },
            data: { isResolved: true }
        });
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

        await this.prisma.organization.update({
            where: { id },
            data: {
                status: OrgStatus.REJECTED,
                statusHistory: [...history, newEntry] as Prisma.InputJsonValue
            }
        });

        // Resolve pending "Account status" tickets for this organization
        return this.prisma.supportTicket.updateMany({
            where: { organizationId: id, isResolved: false, topic: SupportTopic.ACCOUNT_STATUS },
            data: { isResolved: true }
        });
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

        await this.prisma.organization.update({
            where: { id },
            data: {
                status: OrgStatus.SUSPENDED,
                statusHistory: [...history, newEntry] as Prisma.InputJsonValue,
            },
        });

        // Resolve pending "Account status" tickets for this organization
        return this.prisma.supportTicket.updateMany({
            where: { organizationId: id, isResolved: false, topic: SupportTopic.ACCOUNT_STATUS },
            data: { isResolved: true }
        });
    }


    async getSupportTickets(options: {
        page?: number;
        limit?: number;
        search?: string;
    }) {
        const {
            page = 1,
            limit = 10,
            search = ''
        } = options;

        const skip = (page - 1) * limit;
        const take = limit;

        const where: Prisma.SupportTicketWhereInput = search ? {
            OR: [
                { message: { contains: search, mode: 'insensitive' } },
                { organization: { name: { contains: search, mode: 'insensitive' } } }
            ]
        } : {};

        const [tickets, totalRecords] = await Promise.all([
            this.prisma.supportTicket.findMany({
                where,
                skip,
                take,
                include: {
                    organization: {
                        select: { name: true, status: true, contactEmail: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            this.prisma.supportTicket.count({ where })
        ]);

        return {
            data: tickets,
            totalRecords,
            totalPages: Math.ceil(totalRecords / limit),
            currentPage: page
        };
    }

    async getAdminStats() {
        const [pending, approved, rejected, suspended, tickets, platformAdmins] = await Promise.all([
            this.prisma.organization.count({ where: { status: OrgStatus.PENDING } }),
            this.prisma.organization.count({ where: { status: OrgStatus.APPROVED } }),
            this.prisma.organization.count({ where: { status: OrgStatus.REJECTED } }),
            this.prisma.organization.count({ where: { status: OrgStatus.SUSPENDED } }),
            this.prisma.supportTicket.count({ where: { isResolved: false } }),
            this.prisma.user.count({ where: { role: Role.PLATFORM_ADMIN } }),
        ]);

        return {
            PENDING: pending,
            APPROVED: approved,
            REJECTED: rejected,
            SUSPENDED: suspended,
            SUPPORT: tickets,
            PLATFORM_ADMINS: platformAdmins
        };
    }


    async resolveSupportTicket(id: string) {
        return this.prisma.supportTicket.update({
            where: { id },
            data: { isResolved: true }
        });
    }

    // --- Platform Admins ---
    async getPlatformAdmins(options: {
        page?: number;
        limit?: number;
        search?: string;
    }) {
        const {
            page = 1,
            limit = 10,
            search = ''
        } = options;

        const skip = (page - 1) * limit;
        const take = limit;

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

        return {
            data: admins,
            totalRecords,
            totalPages: Math.ceil(totalRecords / limit),
            currentPage: page
        };
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
