import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, ForbiddenException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Role, OrgStatus, SupportTopic, TeacherStatus, StudentStatus } from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';

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
import { FilesService } from '../files/files.service';
import { getPaginationOptions, formatPaginatedResponse, handleFileUpdate, extractUpdateFields, PaginationOptions } from '../common/utils';

@Injectable()
export class OrgService {
    constructor(
        private readonly filesService: FilesService,
        private readonly prisma: PrismaService
    ) { }

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

        const publicUrl = await handleFileUpdate(org.logoUrl, file);

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

    async updateUserAvatar(
        userId: string,
        file: Express.Multer.File,
        uploadedBy: string,
    ) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, avatarUrl: true, organizationId: true },
        });
        if (!user) throw new NotFoundException('User not found');

        const publicUrl = await handleFileUpdate(user.avatarUrl, file);

        // Save new file record via FilesService (for audit trail)
        await this.filesService.saveFile(
            { orgId: user.organizationId ?? 'system', entityType: 'userAvatar', entityId: user.id },
            file,
            uploadedBy,
        );

        // Update user with new avatar URL and bump cache-buster timestamp
        return this.prisma.user.update({
            where: { id: user.id },
            data: {
                avatarUrl: publicUrl,
                avatarUpdatedAt: new Date(),
            },
            select: {
                id: true,
                name: true,
                avatarUrl: true,
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
    async getTeachers(orgId: string, options: PaginationOptions) {
        const { skip, take, sortBy, sortOrder } = getPaginationOptions(options);

        const where: Prisma.TeacherWhereInput = {
            organizationId: orgId,
            status: { not: TeacherStatus.DELETED },
            ...(options.search ? {
                OR: [
                    { user: { name: { contains: options.search, mode: 'insensitive' } } },
                    { user: { email: { contains: options.search, mode: 'insensitive' } } },
                    { subject: { contains: options.search, mode: 'insensitive' } },
                    { department: { contains: options.search, mode: 'insensitive' } },
                    { designation: { contains: options.search, mode: 'insensitive' } },
                ]
            } : {})
        };

        // Handle nested sorting for user fields
        let orderBy: Prisma.TeacherOrderByWithRelationInput = {};
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

        return formatPaginatedResponse(teachers, totalRecords, options.page, options.limit);
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

        const userFields = ['name', 'email', 'phone', 'password'];
        const teacherFields = ['salary', 'subject', 'education', 'designation', 'department', 'emergencyContact', 'bloodGroup', 'address', 'status'];

        const { userData, entityData: teacherData } = await extractUpdateFields(data, userFields, teacherFields, teacher.user.email);

        if (data.isManager !== undefined) {
            userData.role = data.isManager ? Role.ORG_MANAGER : Role.TEACHER;
        }

        if (data.sectionIds !== undefined) {
            teacherData.sections = { set: data.sectionIds.map(id => ({ id })) };
        }

        if (data.joiningDate) {
            const date = new Date(data.joiningDate);
            if (!isNaN(date.getTime())) {
                teacherData.joiningDate = date;
            }
        }

        return this.prisma.$transaction(async (tx) => {
            if (Object.keys(userData).length > 0) {
                await tx.user.update({
                    where: { id: teacher.userId },
                    data: userData
                });
            }

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
    async getCourses(orgId: string, options: PaginationOptions = {}) {
        const { skip, take, sortBy, sortOrder } = getPaginationOptions({ ...options, sortBy: options.sortBy || 'name', sortOrder: options.sortOrder || 'asc' });

        const where: Prisma.CourseWhereInput = {
            organizationId: orgId,
            ...(options.search ? {
                OR: [
                    { name: { contains: options.search, mode: 'insensitive' } },
                    { description: { contains: options.search, mode: 'insensitive' } },
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

        return formatPaginatedResponse(courses, totalRecords, options.page, options.limit);
    }

    async createCourse(orgId: string, data: CreateCourseDto) {
        return this.prisma.course.create({
            data: {
                ...data,
                organizationId: orgId
            }
        });
    }

    async updateCourse(orgId: string, id: string, data: UpdateCourseDto) {
        const course = await this.prisma.course.findUnique({ where: { id } });
        if (!course || course.organizationId !== orgId) {
            throw new NotFoundException('Course not found');
        }
        return this.prisma.course.update({
            where: { id },
            data
        });
    }

    async deleteCourse(orgId: string, id: string) {
        const course = await this.prisma.course.findUnique({
            where: { id },
            include: { sections: true }
        });
        if (!course || course.organizationId !== orgId) {
            throw new NotFoundException('Course not found');
        }
        if (course.sections.length > 0) {
            throw new BadRequestException('Cannot delete course with active sections');
        }
        return this.prisma.course.delete({ where: { id } });
    }

    // --- Sections ---
    async getSections(orgId: string, options: PaginationOptions) {
        const { skip, take, sortBy, sortOrder } = getPaginationOptions({ ...options, sortBy: options.sortBy || 'createdAt', sortOrder: options.sortOrder || 'desc' });

        const where: Prisma.SectionWhereInput = {
            course: { organizationId: orgId },
            ...(options.search ? {
                OR: [
                    { name: { contains: options.search, mode: 'insensitive' } },
                    { semester: { contains: options.search, mode: 'insensitive' } },
                    { year: { contains: options.search, mode: 'insensitive' } },
                    { room: { contains: options.search, mode: 'insensitive' } },
                    { course: { name: { contains: options.search, mode: 'insensitive' } } },
                ]
            } : {})
        };

        // Handle nested sorting for course name
        let orderBy: Prisma.SectionOrderByWithRelationInput = {};
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

        return formatPaginatedResponse(sections, totalRecords, options.page, options.limit);
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
    async getStudents(orgId: string, options: PaginationOptions) {
        const { skip, take, sortBy, sortOrder } = getPaginationOptions(options);

        const where: Prisma.StudentWhereInput = {
            organizationId: orgId,
            status: { not: StudentStatus.DELETED },
            ...(options.search ? {
                OR: [
                    { user: { name: { contains: options.search, mode: 'insensitive' } } },
                    { user: { email: { contains: options.search, mode: 'insensitive' } } },
                    { registrationNumber: { contains: options.search, mode: 'insensitive' } },
                    { major: { contains: options.search, mode: 'insensitive' } },
                    { department: { contains: options.search, mode: 'insensitive' } },
                ]
            } : {})
        };

        // Handle nested sorting for user fields
        let orderBy: Prisma.StudentOrderByWithRelationInput = {};
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

        return formatPaginatedResponse(students, totalRecords, options.page, options.limit);
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

        const userFields = ['name', 'email', 'phone', 'password'];
        const studentFields = [
            'registrationNumber', 'fatherName', 'fee', 'age', 'address', 'major',
            'department', 'admissionDate', 'graduationDate', 'emergencyContact',
            'bloodGroup', 'gender', 'feePlan', 'status'
        ];

        const { userData, entityData: studentData } = await extractUpdateFields(data, userFields, studentFields, student.user.email);

        if (data.registrationNumber && data.registrationNumber !== student.registrationNumber) {
            const existing = await this.prisma.student.findFirst({
                where: { organizationId: orgId, registrationNumber: data.registrationNumber, id: { not: id } }
            });
            if (existing) throw new BadRequestException('Registration number already in use');
        }

        if (data.admissionDate) {
            const date = new Date(data.admissionDate);
            if (!isNaN(date.getTime())) {
                studentData.admissionDate = date;
            }
        }

        if (data.graduationDate !== undefined) {
            if (data.graduationDate) {
                const date = new Date(data.graduationDate);
                if (!isNaN(date.getTime())) {
                    studentData.graduationDate = date;
                }
            } else {
                studentData.graduationDate = null;
            }
        }

        return this.prisma.$transaction(async (tx) => {
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

        const history = (org.statusHistory as Prisma.JsonArray) || [];
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

