import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OrgService {
    private prisma = new PrismaClient();

    // --- Settings ---
    async getSettings(orgId: string) {
        const org = await this.prisma.organization.findUnique({
            where: { id: orgId },
            select: {
                id: true,
                name: true,
                location: true,
                type: true,
                contactEmail: true,
                phone: true,
            },
        });
        if (!org) throw new NotFoundException('Organization not found');
        return org;
    }

    async updateSettings(orgId: string, data: UpdateSettingsDto) {
        return this.prisma.organization.update({
            where: { id: orgId },
            data,
            select: {
                id: true,
                name: true,
                location: true,
                type: true,
                contactEmail: true,
                phone: true,
            },
        });
    }

    // --- Teachers ---
    async getTeachers(orgId: string) {
        return this.prisma.teacher.findMany({
            where: { organizationId: orgId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        phone: true,
                    },
                },
            },
        });
    }

    async createTeacher(orgId: string, data: CreateTeacherDto) {
        // 1. Check if user exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new BadRequestException('User with this email already exists');
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        // 2. Create User and Teacher in transaction
        try {
            const result = await this.prisma.$transaction(async (prisma) => {
                const user = await prisma.user.create({
                    data: {
                        email: data.email,
                        password: hashedPassword,
                        role: data.isAdmin ? 'ORG_ADMIN' : 'TEACHER',
                        organizationId: orgId,
                        name: data.name,
                        phone: data.phone,
                    },
                });

                const teacher = await prisma.teacher.create({
                    data: {
                        userId: user.id,
                        organizationId: orgId,
                        salary: data.salary,
                        subject: data.subject,
                        education: data.education,
                        designation: data.designation,
                    },
                    include: {
                        user: {
                            select: { email: true, name: true, phone: true },
                        },
                    },
                });

                return teacher;
            });
            return result;
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('Failed to create teacher');
        }
    }

    async updateTeacher(orgId: string, id: string, data: UpdateTeacherDto) {
        // We only allow updating the teacher profile for now
        const teacher = await this.prisma.teacher.findFirst({
            where: { id, organizationId: orgId }
        });

        if (!teacher) throw new NotFoundException('Teacher not found');

        return this.prisma.$transaction(async (tx) => {
            // 1. Update User if name/phone provided
            if (data.name !== undefined || data.phone !== undefined) {
                await tx.user.update({
                    where: { id: teacher.userId },
                    data: {
                        name: data.name,
                        phone: data.phone,
                    }
                });
            }

            // 2. Update Teacher
            return tx.teacher.update({
                where: { id },
                data: {
                    salary: data.salary,
                    subject: data.subject,
                    education: data.education,
                    designation: data.designation,
                },
                include: {
                    user: {
                        select: { email: true, name: true, phone: true },
                    },
                },
            });
        });
    }

    async deleteTeacher(orgId: string, id: string) {
        const teacher = await this.prisma.teacher.findFirst({
            where: { id, organizationId: orgId },
        });

        if (!teacher) throw new NotFoundException('Teacher not found');

        // Deleting the user will cascade and delete the teacher record because of onDelete: Cascade
        await this.prisma.user.delete({
            where: { id: teacher.userId },
        });

        return { message: 'Teacher deleted successfully' };
    }

    // --- Classes ---
    async getClasses(orgId: string, user?: { id: string; role: string }) {
        const whereClause: any = { organizationId: orgId };

        // If it's a standard teacher, only show their classes
        if (user && user.role === 'TEACHER') {
            whereClause.teacher = { userId: user.id };
        }

        return this.prisma.class.findMany({
            where: whereClause,
            include: {
                teacher: {
                    include: {
                        user: { select: { email: true, name: true } }
                    }
                }
            }
        });
    }

    async createClass(orgId: string, data: CreateClassDto) {
        return this.prisma.class.create({
            data: {
                ...data,
                organizationId: orgId,
            },
        });
    }

    async updateClass(orgId: string, id: string, data: UpdateClassDto) {
        const cls = await this.prisma.class.findFirst({
            where: { id, organizationId: orgId }
        });

        if (!cls) throw new NotFoundException('Class not found');

        return this.prisma.class.update({
            where: { id },
            data,
        });
    }

    async deleteClass(orgId: string, id: string) {
        const cls = await this.prisma.class.findFirst({
            where: { id, organizationId: orgId }
        });

        if (!cls) throw new NotFoundException('Class not found');

        await this.prisma.class.delete({
            where: { id },
        });

        return { message: 'Class deleted successfully' };
    }
}
