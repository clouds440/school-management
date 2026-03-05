import { UnauthorizedException, NotFoundException, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth/auth.service';

const prisma = new PrismaClient();

@Injectable()
export class AdminService {
    constructor(private readonly authService: AuthService) { }
    async getPendingOrganizations() {
        const orgs = await prisma.organization.findMany({
            where: { approved: false },
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
        return prisma.organization.update({
            where: { id },
            data: { approved: true }
        });
    }

    async rejectOrganization(id: string) {
        const org = await prisma.organization.findUnique({ where: { id } });
        if (!org) {
            throw new NotFoundException('Organization not found');
        }
        await prisma.organization.delete({
            where: { id }
        });
        return { message: 'Organization rejected and deleted successfully' };
    }

    async changeAdminPassword(userId: string, oldPass: string, newPass: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'SUPER_ADMIN') {
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
