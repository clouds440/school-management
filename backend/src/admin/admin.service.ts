import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class AdminService {
    async getPendingOrganizations() {
        return prisma.organization.findMany({
            where: { approved: false },
            select: { id: true, name: true, location: true, type: true, email: true, createdAt: true }
        });
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
}
