import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { Role, OrgStatus, SupportTopic, TeacherStatus, StudentStatus } from '../common/enums';

import { UpdateSettingsDto } from './dto/update-settings.dto';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { FilesService } from '../files/files.service';

@Injectable()
export class OrgService {
    private prisma = new PrismaClient();

    constructor(private readonly filesService: FilesService) { }

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
                logoUrl: true,
                avatarUpdatedAt: true,
                accentColor: true,
                status: true,
                statusHistory: true,
                createdAt: true,
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
                logoUrl: true,
                avatarUpdatedAt: true,
                accentColor: true,
                status: true,
                statusHistory: true,
                createdAt: true,
            },

        });
    }

    async updateLogo(
        orgId: string,
        file: Express.Multer.File,
        uploadedBy: string,
    ) {
        const org = await this.prisma.organization.findUnique({
            where: { id: orgId },
            select: { id: true, logoUrl: true },
        });
        if (!org) throw new NotFoundException('Organization not found');

        // Delete old logo from disk (best-effort)
        if (org.logoUrl) {
            const oldAbsolute = path.resolve(org.logoUrl.replace(/^\/uploads\//, 'uploads/'));
            if (fs.existsSync(oldAbsolute)) {
                fs.unlinkSync(oldAbsolute);
            }
        }

        // Derive a portable relative path from file.path regardless of OS.
        // On Windows multer returns an absolute path like C:\...\uploads\orgs\...
        const forwardSlash = file.path.replace(/\\/g, '/');
        const uploadsIndex = forwardSlash.indexOf('uploads/');
        const relativePath = uploadsIndex >= 0
            ? forwardSlash.slice(uploadsIndex)            // → uploads/orgs/...
            : forwardSlash;
        const publicUrl = `/${relativePath}`;             // → /uploads/orgs/...

        // Save new file record via FilesService (for audit trail)
        await this.filesService.saveFile(
            { orgId, entityType: 'orgLogo', entityId: orgId },
            file,
            uploadedBy,
        );

        // Update org with new logo URL and bump cache-buster timestamp
        return this.prisma.organization.update({
            where: { id: orgId },
            data: {
                logoUrl: publicUrl,
                avatarUpdatedAt: new Date(),
            },
            select: {
                id: true,
                name: true,
                logoUrl: true,
                avatarUpdatedAt: true,
            },
        });
    }

    async submitSupportTicket(orgId: string, topic: SupportTopic, message: string) {
        // Check for existing unresolved tickets
        const existingTicket = await this.prisma.supportTicket.findFirst({
            where: {
                organizationId: orgId,
                topic,
                isResolved: false
            }
        });

        if (existingTicket) {
            throw new ConflictException(`You already have a pending ticket for ${topic.replace('_', ' ').toLowerCase()}. Please wait for it to be resolved.`);
        }

        return this.prisma.supportTicket.create({
            data: {
                organizationId: orgId,
                topic,
                message
            }
        });
    }

    // --- Teachers ---
    async getTeachers(orgId: string, options: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }) {
        const {
            page = 1,
            limit = 10,
            search = '',
            sortBy = 'user.name', // Default sort
            sortOrder = 'asc'
        } = options;

        const skip = (page - 1) * limit;
        const take = limit;

        const where: Prisma.TeacherWhereInput = {
            organizationId: orgId,
            status: { not: TeacherStatus.DELETED },
            ...(search ? {
                OR: [
                    { user: { name: { contains: search, mode: 'insensitive' } } },
                    { user: { email: { contains: search, mode: 'insensitive' } } },
                    { subject: { contains: search, mode: 'insensitive' } },
                    { department: { contains: search, mode: 'insensitive' } },
                    { designation: { contains: search, mode: 'insensitive' } },
                ]
            } : {})
        };

        // Handle nested sorting for user fields
        let orderBy: any = {};
        const userFields = ['name', 'email', 'phone'];

        if (sortBy.startsWith('user.')) {
            const field = sortBy.split('.')[1];
            orderBy = { user: { [field]: sortOrder } };
        } else if (userFields.includes(sortBy)) {
            orderBy = { user: { [sortBy]: sortOrder } };
        } else {
            orderBy = { [sortBy]: sortOrder };
        }

        const [teachers, totalRecords] = await Promise.all([
            this.prisma.teacher.findMany({
                where,
                skip,
                take,
                orderBy,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            phone: true,
                            role: true,
                        },
                    },
                    sections: { select: { id: true, name: true } },
                },
            }),
            this.prisma.teacher.count({ where })
        ]);

        return {
            data: teachers,
            totalRecords,
            totalPages: Math.ceil(totalRecords / limit),
            currentPage: page
        };
    }

    async getTeacher(orgId: string, id: string) {
        const teacher = await this.prisma.teacher.findFirst({
            where: { id, organizationId: orgId, status: { not: TeacherStatus.DELETED } },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        phone: true,
                        role: true,
                    },
                },
                sections: { select: { id: true, name: true } },
            },
        });
        if (!teacher) throw new NotFoundException('Teacher not found');
        return teacher;
    }

    async createTeacher(orgId: string, data: CreateTeacherDto, userContext: { id: string, role: string }) {
        // 1. Check if user exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new BadRequestException('User with this email already exists');
        }

        if (data.isManager && userContext.role === Role.ORG_MANAGER) {
            throw new ForbiddenException('Only Organization Admins can create Managers');
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);


        // 2. Create User and Teacher in transaction
        try {
            const result = await this.prisma.$transaction(async (prisma) => {
                const user = await prisma.user.create({
                    data: {
                        email: data.email,
                        password: hashedPassword,
                        role: data.isManager ? Role.ORG_MANAGER : Role.TEACHER,
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
                        department: data.department,
                        joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined,
                        emergencyContact: data.emergencyContact,
                        bloodGroup: data.bloodGroup,
                        address: data.address,
                        status: data.status,
                        sections: data.sectionIds ? { connect: data.sectionIds.map(id => ({ id })) } : undefined,
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

    async updateTeacher(orgId: string, id: string, data: UpdateTeacherDto, userContext: { id: string, role: string }) {
        // We only allow updating the teacher profile for now
        const teacher = await this.prisma.teacher.findFirst({
            where: { id, organizationId: orgId },
            include: { user: true }
        });

        if (!teacher) throw new NotFoundException('Teacher not found');

        if (userContext.role === Role.ORG_MANAGER) {
            if (teacher.user.role === Role.ORG_ADMIN || teacher.user.role === Role.ORG_MANAGER) {
                throw new ForbiddenException('Managers cannot modify Admin or Manager profiles');
            }
        }

        return this.prisma.$transaction(async (tx) => {
            const userFields = ['name', 'email', 'phone', 'password'];
            const teacherFields = ['salary', 'subject', 'education', 'designation', 'department', 'emergencyContact', 'bloodGroup', 'address', 'status'];
            const userData: Prisma.UserUpdateInput = {};
            const teacherData: Prisma.TeacherUpdateInput = {};

            for (const [key, value] of Object.entries(data)) {
                if (value === undefined) continue;

                if (userFields.includes(key)) {
                    if (key === 'email' && value !== teacher.user.email) {
                        const existing = await tx.user.findUnique({ where: { email: value as string } });
                        if (existing) throw new BadRequestException('Email already in use');
                        userData.email = value;
                    } else if (key === 'password') {
                        if (typeof value === 'string' && value.trim() !== '') {
                            userData.password = await bcrypt.hash(value, 10);
                        }
                    } else if (key !== 'email') {
                        (userData as any)[key] = value;
                    }
                } else if (key === 'isManager') {
                    userData.role = value ? Role.ORG_MANAGER : Role.TEACHER;
                } else if (key === 'sectionIds') {
                    teacherData.sections = { set: (value as string[]).map(id => ({ id })) };
                } else if (key === 'joiningDate') {
                    if (value) {
                        const date = new Date(value as string);
                        if (!isNaN(date.getTime())) {
                            teacherData.joiningDate = date;
                        }
                    }
                } else if (teacherFields.includes(key)) {
                    (teacherData as any)[key] = value;
                }
            }

            if (Object.keys(userData).length > 0) {
                await tx.user.update({
                    where: { id: teacher.userId },
                    data: userData
                });
            }

            // 2. Update Teacher
            if (Object.keys(teacherData).length > 0) {
                await tx.teacher.update({
                    where: { id },
                    data: teacherData
                });
            }

            return tx.teacher.findUnique({
                where: { id },
                include: {
                    user: { select: { email: true, name: true, phone: true, role: true } },
                    sections: { include: { course: true } }
                }
            });
        });
    }

    async deleteTeacher(orgId: string, id: string, userContext: { id: string, role: string }) {
        const teacher = await this.prisma.teacher.findFirst({
            where: { id, organizationId: orgId },
            include: { user: true }
        });

        if (!teacher) throw new NotFoundException('Teacher not found');

        if (userContext.role === Role.ORG_MANAGER) {
            if (teacher.user.role === Role.ORG_ADMIN || teacher.user.role === Role.ORG_MANAGER) {
                throw new ForbiddenException('Managers cannot delete Admin or Manager profiles');
            }
        }

        await this.prisma.teacher.update({
            where: { id },
            data: { status: TeacherStatus.DELETED }
        });


        return { message: 'Teacher deleted successfully' };
    }

    // --- Courses ---
    async getCourses(orgId: string, options: { 
        page?: number; 
        limit?: number; 
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    } = {}) {
        const { 
            page = 1, 
            limit = 10, 
            search = '',
            sortBy = 'name',
            sortOrder = 'asc' 
        } = options;
        const skip = (page - 1) * limit;
        const take = limit;

        const where: Prisma.CourseWhereInput = {
            organizationId: orgId,
            ...(search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ]
            } : {})
        };

        const [courses, totalRecords] = await Promise.all([
            this.prisma.course.findMany({
                where,
                skip,
                take,
                include: { sections: true },
                orderBy: { [sortBy]: sortOrder }
            }),
            this.prisma.course.count({ where })
        ]);

        return {
            data: courses,
            totalRecords,
            totalPages: Math.ceil(totalRecords / limit),
            currentPage: page
        };
    }

    // --- Sections ---
    async getSections(orgId: string, options: { 
        page?: number; 
        limit?: number; 
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }) {
        const { 
            page = 1, 
            limit = 10, 
            search = '',
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = options;
        const skip = (page - 1) * limit;
        const take = limit;

        const where: Prisma.SectionWhereInput = {
            course: { organizationId: orgId },
            ...(search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { semester: { contains: search, mode: 'insensitive' } },
                    { year: { contains: search, mode: 'insensitive' } },
                    { room: { contains: search, mode: 'insensitive' } },
                    { course: { name: { contains: search, mode: 'insensitive' } } },
                ]
            } : {})
        };

        // Handle nested sorting for course name
        let orderBy: any = {};
        if (sortBy === 'courseName') {
            orderBy = { course: { name: sortOrder } };
        } else {
            orderBy = { [sortBy]: sortOrder };
        }

        const [sections, totalRecords] = await Promise.all([
            this.prisma.section.findMany({
                where,
                skip,
                take,
                include: {
                    course: true,
                    teachers: { include: { user: { select: { email: true, name: true } } } },
                },
                orderBy
            }),
            this.prisma.section.count({ where })
        ]);

        return {
            data: sections,
            totalRecords,
            totalPages: Math.ceil(totalRecords / limit),
            currentPage: page
        };
    }

    async createSection(orgId: string, data: CreateSectionDto) {
        return this.prisma.section.create({
            data: {
                name: data.name,
                semester: data.semester,
                year: data.year,
                room: data.room,
                courseId: data.courseId,
            },
        });
    }

    async updateSection(orgId: string, id: string, data: UpdateSectionDto) {
        return this.prisma.section.update({
            where: { id, course: { organizationId: orgId } },
            data,
        });
    }

    async deleteSection(orgId: string, id: string) {
        const section = await this.prisma.section.findFirst({
            where: { id, course: { organizationId: orgId } },
        });
        if (!section) throw new NotFoundException('Section not found');

        await this.prisma.section.delete({ where: { id } });
        return { message: 'Section deleted successfully' };
    }

    // --- Students ---
    async getStudents(orgId: string, options: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }) {
        const {
            page = 1,
            limit = 10,
            search = '',
            sortBy = 'user.name',
            sortOrder = 'asc'
        } = options;

        const skip = (page - 1) * limit;
        const take = limit;

        const where: Prisma.StudentWhereInput = {
            organizationId: orgId,
            status: { not: StudentStatus.DELETED },
            ...(search ? {
                OR: [
                    { user: { name: { contains: search, mode: 'insensitive' } } },
                    { user: { email: { contains: search, mode: 'insensitive' } } },
                    { registrationNumber: { contains: search, mode: 'insensitive' } },
                    { major: { contains: search, mode: 'insensitive' } },
                    { department: { contains: search, mode: 'insensitive' } },
                ]
            } : {})
        };

        // Handle nested sorting for user fields
        let orderBy: any = {};
        const userFields = ['name', 'email', 'phone'];

        if (sortBy.startsWith('user.')) {
            const field = sortBy.split('.')[1];
            orderBy = { user: { [field]: sortOrder } };
        } else if (userFields.includes(sortBy)) {
            orderBy = { user: { [sortBy]: sortOrder } };
        } else {
            orderBy = { [sortBy]: sortOrder };
        }

        const [students, totalRecords] = await Promise.all([
            this.prisma.student.findMany({
                where,
                skip,
                take,
                orderBy,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            phone: true,
                        },
                    },
                    enrollments: {
                        include: {
                            section: {
                                include: { course: true },
                            },
                        },
                    },
                },
            }),
            this.prisma.student.count({ where })
        ]);

        return {
            data: students,
            totalRecords,
            totalPages: Math.ceil(totalRecords / limit),
            currentPage: page
        };
    }

    async getStudent(orgId: string, id: string) {
        const student = await this.prisma.student.findFirst({
            where: { id, organizationId: orgId, status: { not: StudentStatus.DELETED } },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        phone: true,
                    },
                },
                enrollments: {
                    include: {
                        section: {
                            include: { course: true },
                        },
                    },
                },
            },
        });
        if (!student) throw new NotFoundException('Student not found');
        return student;
    }

    async createStudent(orgId: string, data: CreateStudentDto, userContext: { name?: string | null; email: string }) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new BadRequestException('User with this email already exists');
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        try {
            return await this.prisma.$transaction(async (prisma) => {
                const user = await prisma.user.create({
                    data: {
                        email: data.email,
                        password: hashedPassword,
                        role: Role.STUDENT,
                        organizationId: orgId,
                        name: data.name,
                        phone: data.phone,
                    },
                });

                const student = await prisma.student.create({
                    data: {
                        userId: user.id,
                        organizationId: orgId,
                        registrationNumber: data.registrationNumber,
                        fatherName: data.fatherName,
                        fee: data.fee,
                        age: data.age,
                        address: data.address,
                        major: data.major,
                        department: data.department,
                        admissionDate: data.admissionDate ? new Date(data.admissionDate) : undefined,
                        graduationDate: data.graduationDate ? new Date(data.graduationDate) : undefined,
                        emergencyContact: data.emergencyContact,
                        bloodGroup: data.bloodGroup,
                        gender: data.gender,
                        feePlan: data.feePlan,
                        status: data.status,
                        enrollments: data.sectionIds ? { create: data.sectionIds.map(sectionId => ({ sectionId })) } : undefined,
                        updatedBy: userContext.name || userContext.email
                    },
                    include: {
                        user: { select: { email: true, name: true, phone: true } },
                        enrollments: { include: { section: true } }
                    },
                });

                return student;
            });
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('Failed to create student');
        }
    }

    async updateStudent(orgId: string, id: string, data: UpdateStudentDto, user: { name?: string | null; email: string }) {
        const student = await this.prisma.student.findFirst({
            where: { id, organizationId: orgId },
            include: { user: true }
        });

        if (!student) throw new NotFoundException('Student not found');

        return this.prisma.$transaction(async (tx) => {
            const userFields = ['name', 'email', 'phone', 'password'];
            const userData: Prisma.UserUpdateInput = {};
            const studentData: Prisma.StudentUpdateInput = {};

            const studentFields = [
                'registrationNumber', 'fatherName', 'fee', 'age', 'address', 'major',
                'department', 'admissionDate', 'graduationDate', 'emergencyContact',
                'bloodGroup', 'gender', 'feePlan', 'status'
            ];

            for (const [key, value] of Object.entries(data)) {
                if (value === undefined) continue;

                if (userFields.includes(key)) {
                    if (key === 'email' && value !== student.user.email) {
                        const existing = await tx.user.findUnique({ where: { email: value as string } });
                        if (existing) throw new BadRequestException('Email already in use');
                        userData.email = value;
                    } else if (key === 'password') {
                        if (typeof value === 'string' && value.trim() !== '') {
                            userData.password = await bcrypt.hash(value, 10);
                        }
                    } else if (key !== 'email') {
                        (userData as any)[key] = value;
                    }
                } else if (key === 'registrationNumber' && value !== student.registrationNumber) {
                    const existing = await tx.student.findFirst({
                        where: { organizationId: orgId, registrationNumber: value as string, id: { not: id } }
                    });
                    if (existing) throw new BadRequestException('Registration number already in use');
                    studentData.registrationNumber = value;
                } else if (key === 'sectionIds') {
                    // Handled separately
                } else if (key === 'admissionDate' || key === 'graduationDate') {
                    if (value) {
                        const date = new Date(value as string);
                        if (!isNaN(date.getTime())) {
                            (studentData as any)[key] = date;
                        }
                    } else if (key === 'graduationDate') {
                        (studentData as any)[key] = null; // Graduation date can be cleared
                    }
                } else if (studentFields.includes(key)) {
                    (studentData as any)[key] = value;
                }
            }

            if (Object.keys(userData).length > 0) {
                await tx.user.update({
                    where: { id: student.userId },
                    data: userData
                });
            }

            if (Object.keys(studentData).length > 0) {
                studentData.updatedBy = user.name || user.email;
                await tx.student.update({
                    where: { id },
                    data: studentData
                });
            }

            if (data.sectionIds !== undefined) {
                await tx.enrollment.deleteMany({ where: { studentId: id } });
                if (data.sectionIds.length > 0) {
                    await tx.enrollment.createMany({
                        data: data.sectionIds.map(sectionId => ({ studentId: id, sectionId }))
                    });
                }
            }

            return tx.student.findUnique({
                where: { id },
                include: {
                    user: { select: { email: true, name: true, phone: true } },
                    enrollments: { include: { section: true } }
                },
            });
        });
    }

    async deleteStudent(orgId: string, id: string) {
        const student = await this.prisma.student.findFirst({
            where: { id, organizationId: orgId },
        });

        if (!student) throw new NotFoundException('Student not found');

        await this.prisma.student.update({
            where: { id },
            data: { status: StudentStatus.DELETED }
        });

        return { message: 'Student deleted successfully' };
    }

    async reapply(orgId: string) {
        const org = await this.prisma.organization.findUnique({
            where: { id: orgId },
        });

        if (!org) throw new NotFoundException('Organization not found');
        if (org.status !== OrgStatus.REJECTED) {
            throw new BadRequestException('Only rejected organizations can re-apply');
        }

        const history = (org.statusHistory as any[]) || [];
        const newHistory = [
            ...history,
            {
                status: OrgStatus.PENDING,
                message: 'Organization has re-applied for verification.',
                adminName: 'System',
                adminRole: 'Automation',
                createdAt: new Date().toISOString(),
            }
        ];

        return this.prisma.organization.update({
            where: { id: orgId },
            data: {
                status: OrgStatus.PENDING,
                statusHistory: newHistory,
            },
        });
    }

    async getStats(orgId: string, user: { id: string; role: string }) {
        const [teachers, courses, sections, students] = await Promise.all([
            this.prisma.teacher.count({ where: { organizationId: orgId, status: { not: TeacherStatus.DELETED } } }),
            this.prisma.course.count({ where: { organizationId: orgId } }),
            this.prisma.section.count({ where: { course: { organizationId: orgId } } }),
            this.prisma.student.count({ where: { organizationId: orgId, status: { not: StudentStatus.DELETED } } }),
        ]);

        return {
            TEACHERS: teachers,
            COURSES: courses,
            SECTIONS: sections,
            STUDENTS: students,
        };
    }
}

