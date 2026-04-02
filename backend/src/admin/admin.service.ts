import { UnauthorizedException, NotFoundException, Injectable } from '@nestjs/common';
import { Prisma, User as UserEntity, Organization } from '@prisma/client';
import { OrgStatus, Role, MailStatus, MailCategory } from '../common/enums';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { getPaginationOptions, formatPaginatedResponse, mapStatusCounts, PaginationOptions } from '../common/utils';
import { MailService } from '../mail/mail.service';
import { MailUser } from '../mail/interfaces/mail-user.interface';

import { CreatePlatformAdminDto } from './dto/create-platform-admin.dto';
import { UpdatePlatformAdminDto } from './dto/update-platform-admin.dto';


@Injectable()
export class AdminService {
    constructor(
        private readonly authService: AuthService,
        private readonly prisma: PrismaService,
        private readonly mailService: MailService
    ) { }
    
    private orgWithAdminInclude = Prisma.validator<Prisma.OrganizationInclude>()({
        users: {
            where: { role: Role.ORG_ADMIN },
            select: { id: true },
            take: 1
        }
    });

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
            }) as unknown as (Organization & { users: { id: string }[] })[],
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
            adminUserId: (org as (Organization & { users: { id: string }[] })).users?.[0]?.id
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

        // Instant Revocation: Force logout all users to refresh their tokens with the new status
        await this.prisma.user.updateMany({
            where: { organizationId: id },
            data: { tokenVersion: { increment: 1 } }
        });

        // Find the admin user to send the welcome/re-approval mail
        const orgAdmin = await this.prisma.user.findFirst({
            where: { organizationId: id, role: Role.ORG_ADMIN }
        });

        if (orgAdmin) {
            let subject = `Welcome to EduManage: ${org.name}`;
            let message = `Congratulations! Your organization **${org.name}** has been approved. You now have full access to your dashboard.\n\nWelcome to the EduManage community!`;
            
            if (org.status === OrgStatus.REJECTED) {
                subject = `Re-approval of Your Organization: ${org.name}`;
                message = `Great news! Your organization **${org.name}** has been re-approved after your application was revised. You now have full access back to your dashboard.`;
            } else if (org.status === OrgStatus.SUSPENDED) {
                subject = `Account Unsuspended: ${org.name}`;
                message = `Your organization **${org.name}** has been unsuspended. You can now resume your activities on the platform.`;
            }

            // Send NO_REPLY mail
            await this.mailService.createMail({
                subject,
                category: MailCategory.PLATFORM_NOTICE,
                priority: 'NORMAL',
                message,
                assigneeIds: [orgAdmin.id],
            }, { 
                id: admin.id, 
                role: admin.role, 
                name: admin.name || null, 
                email: admin.email, 
                organizationId: null 
            }, true); // true for noReply
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

            // 2. Instant Revocation for all Org users
            await tx.user.updateMany({
                where: { organizationId: id },
                data: { tokenVersion: { increment: 1 } }
            });

            // 3. Find any admin user of this organization to be the target of the mail
            const orgAdmin = await tx.user.findFirst({
                where: { organizationId: id, role: Role.ORG_ADMIN }
            });

            // 4. Create a Mail thread (Notice) - No Reply
            const mail = await tx.mail.create({
                data: {
                    subject: 'Application Status Update: REJECTED',
                    category: 'System Notice',
                    priority: 'URGENT',
                    status: MailStatus.NO_REPLY,
                    creatorId: admin.id,
                    creatorRole: admin.role,
                    organizationId: id,
                    targetRole: Role.ORG_ADMIN,
                    assigneeId: orgAdmin?.id,
                }
            });

            // 5. Initial Message
            await tx.mailMessage.create({
                data: {
                    mailId: mail.id,
                    senderId: admin.id,
                    content: reason
                }
            });

            // 6. Mark as read for the admin (sender)
            await tx.mailUserView.create({
                data: {
                    userId: admin.id,
                    mailId: mail.id,
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

            // 2. Instant Revocation for all Org users
            await tx.user.updateMany({
                where: { organizationId: id },
                data: { tokenVersion: { increment: 1 } }
            });

            // 3. Find any admin user of this organization to be the target of the mail
            const orgAdmin = await tx.user.findFirst({
                where: { organizationId: id, role: Role.ORG_ADMIN }
            });

            // 4. Create a Mail thread (Notice) - No Reply
            const mail = await tx.mail.create({
                data: {
                    subject: 'Organization Status Update: SUSPENDED',
                    category: 'Security/Admin Notice',
                    priority: 'URGENT',
                    status: MailStatus.NO_REPLY,
                    creatorId: admin.id,
                    creatorRole: admin.role,
                    organizationId: id,
                    targetRole: Role.ORG_ADMIN,
                    assigneeId: orgAdmin?.id,
                }
            });

            // 5. Initial Message
            await tx.mailMessage.create({
                data: {
                    mailId: mail.id,
                    senderId: admin.id,
                    content: reason
                }
            });

            // 6. Mark as read for the admin (sender)
            await tx.mailUserView.create({
                data: {
                    userId: admin.id,
                    mailId: mail.id,
                    lastViewedAt: new Date()
                }
            });

            return updatedOrg;
        });

        return result;
    }


    async getAdminStats(user: MailUser) {
        const [orgStatusCounts, unreadMail, platformAdmins] = await Promise.all([
            this.prisma.organization.groupBy({
                by: ['status'],
                _count: { _all: true }
            }),
            this.mailService.getUnreadCount(user),
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
