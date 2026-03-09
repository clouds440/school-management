import { UnauthorizedException, NotFoundException, Injectable } from '@nestjs/common';
import { PrismaClient, Organization, OrgStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth/auth.service';

const prisma = new PrismaClient();

import { CreatePlatformAdminDto } from './dto/create-platform-admin.dto';
import { UpdatePlatformAdminDto } from './dto/update-platform-admin.dto';


@Injectable()
export class AdminService {
    constructor(private readonly authService: AuthService) { }

    async getOrganizations(status?: OrgStatus) {
        const orgs = await prisma.organization.findMany({
            where: status ? { status } : {},

            include: {

                users: {
                    where: { role: 'ORG_ADMIN' },
                    select: { email: true },
                    take: 1
                }
            }
        });
        return orgs.map(org => ({
            id: org.id,
            name: org.name,
            location: org.location,
            type: org.type,
            createdAt: org.createdAt,
            email: org.users[0]?.email || 'No email'
        }));
    }

    async approveOrganization(id: string) {
        const org = await prisma.organization.findUnique({ where: { id } });
        if (!org) {
            throw new NotFoundException('Organization not found');
        }
        await prisma.organization.update({
            where: { id },
            data: { status: 'APPROVED' }
        });

        // Resolve pending "Account status" tickets for this organization
        return prisma.supportTicket.updateMany({
            where: { organizationId: id, isResolved: false, topic: 'ACCOUNT_STATUS' },
            data: { isResolved: true }
        });
    }



    async rejectOrganization(id: string, reason: string) {
        const org = await prisma.organization.findUnique({ where: { id } });
        if (!org) {
            throw new NotFoundException('Organization not found');
        }

        await prisma.organization.update({
            where: { id },
            data: {
                status: 'REJECTED',
                statusMessage: reason
            }
        });

        // Resolve pending "Account status" tickets for this organization
        return prisma.supportTicket.updateMany({
            where: { organizationId: id, isResolved: false, topic: 'ACCOUNT_STATUS' },
            data: { isResolved: true }
        });
    }


    async suspendOrganization(id: string, reason: string) {
        const org = await prisma.organization.findUnique({ where: { id } });
        if (!org) {
            throw new NotFoundException('Organization not found');
        }

        await prisma.organization.update({
            where: { id },
            data: {
                status: 'SUSPENDED',
                statusMessage: reason,
            },
        });

        // Resolve pending "Account status" tickets for this organization
        return prisma.supportTicket.updateMany({
            where: { organizationId: id, isResolved: false, topic: 'ACCOUNT_STATUS' },
            data: { isResolved: true }
        });
    }


    async getSupportTickets() {
        return prisma.supportTicket.findMany({
            include: {
                organization: {
                    select: { name: true, status: true, contactEmail: true }
                }

            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getAdminStats() {
        const [pending, approved, rejected, suspended, tickets, platformAdmins] = await Promise.all([
            prisma.organization.count({ where: { status: 'PENDING' } }),
            prisma.organization.count({ where: { status: 'APPROVED' } }),
            prisma.organization.count({ where: { status: 'REJECTED' } }),
            prisma.organization.count({ where: { status: 'SUSPENDED' } }),
            prisma.supportTicket.count({ where: { isResolved: false } }),
            prisma.user.count({ where: { role: 'PLATFORM_ADMIN' } }),
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
        return prisma.supportTicket.update({
            where: { id },
            data: { isResolved: true }
        });
    }

    // --- Platform Admins ---
    async getPlatformAdmins() {
        return prisma.user.findMany({
            where: { role: 'PLATFORM_ADMIN' },
            select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true }
        });
    }

    async createPlatformAdmin(data: CreatePlatformAdminDto) {
        const existing = await prisma.user.findUnique({ where: { email: data.email } });
        if (existing) throw new UnauthorizedException('Email already in use');

        const hashedPassword = await bcrypt.hash(data.password, 10);
        return prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                phone: data.phone,
                role: 'PLATFORM_ADMIN',
            },
            select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true }
        });
    }

    async updatePlatformAdmin(id: string, data: UpdatePlatformAdminDto) {
        const admin = await prisma.user.findUnique({ where: { id, role: 'PLATFORM_ADMIN' } });
        if (!admin) throw new NotFoundException('Platform admin not found');

        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.email) updateData.email = data.email;
        if (data.phone) updateData.phone = data.phone;
        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        return prisma.user.update({
            where: { id },
            data: updateData,
            select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true }
        });
    }

    async deletePlatformAdmin(id: string) {
        const admin = await prisma.user.findUnique({ where: { id, role: 'PLATFORM_ADMIN' } });
        if (!admin) throw new NotFoundException('Platform admin not found');

        await prisma.user.delete({ where: { id } });
        return { message: 'Platform admin deleted successfully' };
    }



    async changeAdminPassword(userId: string, oldPass: string, newPass: string) {

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'PLATFORM_ADMIN')) {
            throw new UnauthorizedException('Admin not found');
        }

        const isMatch = await bcrypt.compare(oldPass, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Incorrect old password');
        }

        const hashedNew = await bcrypt.hash(newPass, 10);
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedNew,
                isFirstLogin: false
            }
        });

        return this.authService.generateToken(updatedUser);
    }
}
