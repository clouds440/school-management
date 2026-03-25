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
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import * as bcrypt from 'bcrypt';
import { FilesService } from '../files/files.service';
import { getPaginationOptions, formatPaginatedResponse, handleFileUpdate, extractUpdateFields, PaginationOptions } from '../common/utils';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';

interface JwtPayload {
    name: string | null | undefined;
    id: string;
    role?: Role | string;
    email?: string;
}

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
                            avatarUrl: true,
                            avatarUpdatedAt: true,
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
                        avatarUrl: true,
                        avatarUpdatedAt: true,
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
            throw new ConflictException('A user with this email address already exists in the system');
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
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    const target = (error.meta?.target as string[]) || [];
                    if (target.includes('email')) throw new ConflictException('Email address already in use');
                    // Add other unique fields if necessary
                }
            }
            if (error instanceof ForbiddenException || error instanceof ConflictException || error instanceof BadRequestException) throw error;
            console.error('[CreateTeacher Error]:', error);
            throw new InternalServerErrorException('An unexpected error occurred while creating the teacher account');
        }
    }

    async updateTeacher(orgId: string, id: string, data: UpdateTeacherDto, userContext: { id: string, role: string }) {
        const teacher = await this.prisma.teacher.findFirst({
            where: { id, organizationId: orgId },
            include: { user: true }
        });

        if (!teacher) throw new NotFoundException('Teacher not found');

        if (userContext.role === Role.ORG_MANAGER) {
            if (teacher.user.role === Role.ORG_ADMIN || (userContext.id !== teacher.userId && teacher.user.role === Role.ORG_MANAGER)) {
                throw new ForbiddenException('Managers cannot modify Admin or Manager profiles');
            }
        }

        const userFields = ['name', 'email', 'phone', 'password'];
        const teacherFields = ['salary', 'subject', 'education', 'designation', 'department', 'emergencyContact', 'bloodGroup', 'address', 'status'];

        const { userData, entityData: teacherData } = await extractUpdateFields(data as unknown as Record<string, unknown>, userFields, teacherFields, teacher.user.email);

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
                    user: { select: { email: true, name: true, phone: true, role: true, avatarUrl: true, avatarUpdatedAt: true } },
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
            ...(options.my && options.userId ? {
                sections: {
                    some: {
                        teachers: {
                            some: { userId: options.userId }
                        }
                    }
                }
            } : {}),
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
            ...(options.my && options.userId ? {
                OR: [
                    { teachers: { some: { userId: options.userId } } },
                    { enrollments: { some: { student: { userId: options.userId } } } }
                ]
            } : {}),
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
                    _count: { select: { enrollments: true } }
                },
                orderBy
            }),
            this.prisma.section.count({ where })
        ]);

        const formattedSections = sections.map(s => ({
            ...s,
            studentsCount: s._count?.enrollments || 0
        }));

        return formatPaginatedResponse(formattedSections, totalRecords, options.page, options.limit);
    }

    async getSection(orgId: string, id: string) {
        const section = await this.prisma.section.findUnique({
            where: { id },
            include: {
                course: true,
                teachers: { include: { user: { select: { email: true, name: true } } } },
                enrollments: {
                    include: {
                        student: {
                            include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, avatarUpdatedAt: true } } }
                        }
                    }
                },
                assessments: true
            }
        });

        if (!section || section.course.organizationId !== orgId) {
            throw new NotFoundException('Section not found');
        }

        return {
            ...section,
            students: section.enrollments.map(e => ({
                ...e.student,
                user: e.student.user
            })),
            studentsCount: section.enrollments.length
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
    async getStudents(orgId: string, options: PaginationOptions) {
        const { skip, take, sortBy, sortOrder } = getPaginationOptions(options);

        const where: Prisma.StudentWhereInput = {
            organizationId: orgId,
            status: { not: StudentStatus.DELETED },
            ...(options.sectionId ? {
                enrollments: {
                    some: { sectionId: options.sectionId }
                }
            } : {}),
            ...(options.my && options.userId ? {
                enrollments: {
                    some: {
                        section: {
                            teachers: {
                                some: { userId: options.userId }
                            }
                        }
                    }
                }
            } : {}),
            ...(options.search ? {
                OR: [
                    { user: { name: { contains: options.search, mode: 'insensitive' } } },
                    { user: { email: { contains: options.search, mode: 'insensitive' } } },
                    { registrationNumber: { contains: options.search, mode: 'insensitive' } },
                    { rollNumber: { contains: options.search, mode: 'insensitive' } },
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
                            avatarUrl: true,
                            avatarUpdatedAt: true,
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
                        avatarUrl: true,
                        avatarUpdatedAt: true,
                    },
                },
                enrollments: {
                    include: {
                        section: {
                            include: { 
                                course: true,
                                teachers: { include: { user: true } }
                            },
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
            throw new ConflictException('A user with this email address already exists in the system');
        }

        const existingRegNum = await this.prisma.student.findFirst({
            where: { organizationId: orgId, registrationNumber: data.registrationNumber }
        });

        if (existingRegNum) {
            throw new ConflictException(`Registration number "${data.registrationNumber}" is already assigned to another student in this organization`);
        }

        const existingRollNum = await this.prisma.student.findFirst({
            where: { organizationId: orgId, rollNumber: data.rollNumber }
        });

        if (existingRollNum) {
            throw new ConflictException(`Roll number "${data.rollNumber}" is already assigned to another student in this organization`);
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
                        rollNumber: data.rollNumber,
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
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    const target = (error.meta?.target as string[]) || [];
                    if (target.includes('email')) throw new ConflictException('Email address already in use');
                    if (target.includes('registrationNumber')) throw new ConflictException('Registration number already in use');
                    if (target.includes('rollNumber')) throw new ConflictException('Roll number already in use');
                }
            }
            if (error instanceof ConflictException || error instanceof BadRequestException) throw error;
            console.error('[CreateStudent Error]:', error);
            throw new InternalServerErrorException('An unexpected error occurred while creating the student record');
        }
    }

    async updateStudent(orgId: string, id: string, data: UpdateStudentDto, userContext: { role: Role; name?: string | null; email: string }) {
        const student = await this.prisma.student.findFirst({
            where: { id, organizationId: orgId },
            include: { user: true }
        });

        if (!student) throw new NotFoundException('Student not found');

        const userFields = ['name', 'email', 'phone', 'password'];
        const studentFields = [
            'registrationNumber', 'rollNumber', 'fatherName', 'fee', 'age', 'address', 'major',
            'department', 'admissionDate', 'graduationDate', 'emergencyContact',
            'bloodGroup', 'gender', 'feePlan', 'status'
        ];

        const { userData, entityData: studentData } = await extractUpdateFields(data as unknown as Record<string, unknown>, userFields, studentFields, student.user.email);

        // --- Role-based Field Locking ---
        const isOrgAdmin = userContext.role === Role.ORG_ADMIN;
        if (!isOrgAdmin) {
            delete studentData.registrationNumber;
            delete studentData.rollNumber;
        }

        if (studentData.registrationNumber && studentData.registrationNumber !== student.registrationNumber) {
            const existing = await this.prisma.student.findFirst({
                where: { organizationId: orgId, registrationNumber: studentData.registrationNumber, id: { not: id } }
            });
            if (existing) throw new BadRequestException('Registration number already in use');
        }

        if (studentData.rollNumber && studentData.rollNumber !== student.rollNumber) {
            const existing = await this.prisma.student.findFirst({
                where: { organizationId: orgId, rollNumber: studentData.rollNumber, id: { not: id } }
            });
            if (existing) throw new BadRequestException('Roll number already in use');
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
                studentData.updatedBy = userContext.name || userContext.email;
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
                    user: { select: { email: true, name: true, phone: true, avatarUrl: true, avatarUpdatedAt: true } },
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

    async getStudentByUserId(userId: string) {
        return this.prisma.student.findUnique({ where: { userId } });
    }

    async getTeacherByUserId(userId: string) {
        return this.prisma.teacher.findUnique({ where: { userId } });
    }

    async getProfile(orgId: string, user: JwtPayload) {
        if (user.role === Role.STUDENT) {
            const student = await this.prisma.student.findUnique({
                where: { userId: user.id },
                include: {
                    user: { select: { id: true, email: true, name: true, phone: true, avatarUrl: true, avatarUpdatedAt: true } },
                    enrollments: { include: { section: { include: { course: true } } } }
                }
            });
            if (!student) throw new NotFoundException('Student profile not found');
            return student;
        }

        if (user.role === Role.TEACHER || user.role === Role.ORG_MANAGER) {
            const teacher = await this.prisma.teacher.findUnique({
                where: { userId: user.id },
                include: {
                    user: { select: { id: true, email: true, name: true, phone: true, role: true, avatarUrl: true, avatarUpdatedAt: true } },
                    sections: { include: { course: true } }
                }
            });
            if (!teacher) throw new NotFoundException('Teacher profile not found');
            return teacher;
        }

        throw new ForbiddenException('Profile access not allowed for this role');
    }

    async updateProfile(orgId: string, user: JwtPayload, data: Partial<UpdateStudentDto | UpdateTeacherDto>) {
        if (user.role === Role.STUDENT) {
            const student = await this.prisma.student.findUnique({ where: { userId: user.id } });
            if (!student) throw new NotFoundException('Student profile not found');

            // Strictly Allow only these fields for students
            const allowedFields = ['phone', 'fatherName', 'age', 'address', 'emergencyContact', 'bloodGroup', 'password'];
            const filteredData = Object.keys(data)
                .filter(key => allowedFields.includes(key))
                .reduce((obj, key) => {
                    obj[key] = data[key];
                    return obj;
                }, {});

            return this.updateStudent(orgId, student.id, filteredData as any, {
                role: Role.STUDENT,
                name: user.name,
                email: user.email!
            });
        }

        if (user.role === Role.TEACHER || user.role === Role.ORG_MANAGER) {
            const teacher = await this.prisma.teacher.findUnique({ where: { userId: user.id } });
            if (!teacher) throw new NotFoundException('Teacher profile not found');

            // Standard protection for teachers updating their own profile
            const allowedFields = ['emergencyContact', 'bloodGroup', 'address', 'password'];
            const filteredData = Object.keys(data)
                .filter(key => allowedFields.includes(key))
                .reduce((obj, key) => {
                    obj[key] = data[key];
                    return obj;
                }, {});

            return this.updateTeacher(orgId, teacher.id, filteredData as any, {
                id: user.id,
                role: user.role
            });
        }

        throw new ForbiddenException('Profile update not allowed for this role');
    }

    // --- Assessments ---
    async createAssessment(orgId: string, data: CreateAssessmentDto, user: JwtPayload) {
        // Permission check: Manager/Teacher must be assigned to the section
        if (user.role === Role.TEACHER || user.role === Role.ORG_MANAGER) {
            const assignment = await this.prisma.section.findFirst({
                where: { 
                    id: data.sectionId,
                    teachers: { some: { userId: user.id } }
                }
            });
            if (!assignment) {
                throw new ForbiddenException('You are not assigned to this section and cannot create assessments for it.');
            }
        }

        // Validate total weightage for the section
        const sectionAssessments = await this.prisma.assessment.findMany({
            where: { sectionId: data.sectionId }
        });

        const totalWeightage = sectionAssessments.reduce((sum, a) => sum + a.weightage, 0);
        if (totalWeightage + data.weightage > 100) {
            throw new BadRequestException(`Total weightage for this section cannot exceed 100%. Current total: ${totalWeightage}%`);
        }

        return this.prisma.assessment.create({
            data: {
                ...data,
                organizationId: orgId,
                dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
            }
        });
    }

    async getAssessments(orgId: string, user: { id: string, role: string | Role }, filters: { sectionId?: string, courseId?: string }) {
        let allowedSectionIds: string[] | undefined = undefined;

        if (user.role === Role.STUDENT) {
            const enrollments = await this.prisma.enrollment.findMany({
                where: { student: { userId: user.id } },
                select: { sectionId: true }
            });
            allowedSectionIds = enrollments.map(e => e.sectionId);

            // If a specific section filter was provided, ensure it's within the allowed sections
            if (filters.sectionId && !allowedSectionIds.includes(filters.sectionId)) {
                return []; // unauthorized intersection returns empty
            }
        }

        const whereClause: import('@prisma/client').Prisma.AssessmentWhereInput = { organizationId: orgId };
        if (filters.courseId) whereClause.courseId = filters.courseId;
        
        if (user.role === Role.STUDENT) {
            whereClause.sectionId = filters.sectionId ? filters.sectionId : (allowedSectionIds ? { in: allowedSectionIds } : undefined);
        } else if (user.role === Role.TEACHER || user.role === Role.ORG_MANAGER) {
            // Restriction for Managers/Teachers: only assigned sections
            const assignedSections = await this.prisma.section.findMany({
                where: { teachers: { some: { userId: user.id } } },
                select: { id: true }
            });
            const assignedIds = assignedSections.map(s => s.id);
            
            if (filters.sectionId) {
                if (!assignedIds.includes(filters.sectionId)) {
                    throw new ForbiddenException('You are not authorized to view assessments for this section.');
                }
                whereClause.sectionId = filters.sectionId;
            } else {
                whereClause.sectionId = { in: assignedIds };
            }
        } else if (filters.sectionId) {
            whereClause.sectionId = filters.sectionId;
        }

        return this.prisma.assessment.findMany({
            where: whereClause,
            include: {
                _count: {
                    select: { grades: true, submissions: true }
                },
                section: { 
                    select: { 
                        id: true, 
                        name: true,
                        teachers: { select: { user: { select: { name: true } } } }
                    } 
                },
                ...(user.role === Role.STUDENT ? {
                    grades: {
                        where: { student: { userId: user.id } }
                    }
                } : {})
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async updateAssessment(orgId: string, id: string, data: UpdateAssessmentDto, user: JwtPayload) {
        const assessment = await this.prisma.assessment.findUnique({ where: { id } });
        if (!assessment || assessment.organizationId !== orgId) {
            throw new NotFoundException('Assessment not found');
        }

        // Permission check: Manager/Teacher must be assigned to the section
        if (user.role === Role.TEACHER || user.role === Role.ORG_MANAGER) {
            const assignment = await this.prisma.section.findFirst({
                where: { 
                    id: assessment.sectionId,
                    teachers: { some: { userId: user.id } }
                }
            });
            if (!assignment) {
                throw new ForbiddenException('You are not authorized to modify this assessment.');
            }
        }

        if (data.weightage !== undefined) {
            const sectionAssessments = await this.prisma.assessment.findMany({
                where: { sectionId: assessment.sectionId, id: { not: id } }
            });

            const totalWeightage = sectionAssessments.reduce((sum, a) => sum + a.weightage, 0);
            if (totalWeightage + data.weightage > 100) {
                throw new BadRequestException(`Total weightage for this section cannot exceed 100%. Current total: ${totalWeightage}%`);
            }
        }

        return this.prisma.assessment.update({
            where: { id },
            data: {
                ...data,
                dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
            }
        });
    }

    async deleteAssessment(orgId: string, id: string, user: JwtPayload) {
        const assessment = await this.prisma.assessment.findUnique({ where: { id } });
        if (!assessment || assessment.organizationId !== orgId) {
            throw new NotFoundException('Assessment not found');
        }

        // Permission check: Manager/Teacher must be assigned to the section
        if (user.role === Role.TEACHER || user.role === Role.ORG_MANAGER) {
            const assignment = await this.prisma.section.findFirst({
                where: { 
                    id: assessment.sectionId,
                    teachers: { some: { userId: user.id } }
                }
            });
            if (!assignment) {
                throw new ForbiddenException('You are not authorized to delete this assessment.');
            }
        }

        return this.prisma.assessment.delete({ where: { id } });
    }

    // --- Grades ---
    async getGrades(orgId: string, assessmentId: string, user?: JwtPayload) {
        let studentFilter = {};
        if (user && user.role === Role.STUDENT) {
            const student = await this.getStudentByUserId(user.id);
            if (student) studentFilter = { studentId: student.id };
        }

        return this.prisma.grade.findMany({
            where: {
                assessment: { id: assessmentId, organizationId: orgId },
                ...studentFilter
            },
            include: {
                student: {
                    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } }
                }
            }
        });
    }

    async updateGrade(orgId: string, assessmentId: string, studentId: string, data: UpdateGradeDto, userId: string, userRole: Role) {
        const assessment = await this.prisma.assessment.findUnique({ where: { id: assessmentId } });
        if (!assessment || assessment.organizationId !== orgId) {
            throw new NotFoundException('Assessment not found');
        }

        const grade = await this.prisma.grade.findUnique({
            where: { assessmentId_studentId: { assessmentId, studentId } }
        });

        if (grade && grade.status === 'FINALIZED' && userRole !== Role.ORG_ADMIN) {
            throw new ForbiddenException('Only Org Admin can update finalized grades');
        }

        if (data.marksObtained > assessment.totalMarks) {
            throw new BadRequestException(`Marks obtained (${data.marksObtained}) cannot exceed total marks (${assessment.totalMarks})`);
        }

        return this.prisma.grade.upsert({
            where: { assessmentId_studentId: { assessmentId, studentId } },
            create: {
                assessmentId,
                studentId,
                marksObtained: data.marksObtained,
                feedback: data.feedback,
                status: data.status || 'DRAFT',
                updatedBy: userId,
            },
            update: {
                marksObtained: data.marksObtained,
                feedback: data.feedback,
                status: data.status,
                updatedBy: userId,
            }
        });
    }

    async publishGrades(orgId: string, assessmentId: string) {
        return this.prisma.grade.updateMany({
            where: { assessmentId, assessment: { organizationId: orgId } },
            data: { status: 'PUBLISHED' }
        });
    }

    async finalizeGrades(orgId: string, assessmentId: string) {
        return this.prisma.grade.updateMany({
            where: { assessmentId, assessment: { organizationId: orgId } },
            data: { status: 'FINALIZED' }
        });
    }

    async getAssessment(orgId: string, id: string) {
        const assessment = await this.prisma.assessment.findUnique({
            where: { id, organizationId: orgId },
            include: {
                course: true,
                section: true,
            },
        });

        if (!assessment) throw new NotFoundException('Assessment not found');

        const files = await this.prisma.file.findMany({
            where: { entityType: 'ASSESSMENT', entityId: id }
        });

        return { ...assessment, files };
    }

    // --- Submissions ---
    async createSubmission(orgId: string, studentId: string, data: CreateSubmissionDto & { assessmentId: string }) {
        const assessment = await this.prisma.assessment.findUnique({ where: { id: data.assessmentId } });
        if (!assessment || assessment.organizationId !== orgId) {
            throw new NotFoundException('Assessment not found');
        }

        if (assessment.dueDate && new Date() > assessment.dueDate) {
            throw new BadRequestException('Submission deadline has passed');
        }

        return this.prisma.submission.create({
            data: {
                ...data,
                studentId,
            }
        });
    }

    async getSubmissions(orgId: string, assessmentId: string, user?: JwtPayload) {
        let studentFilter = {};
        if (user && user.role === Role.STUDENT) {
            const student = await this.getStudentByUserId(user.id);
            if (student) studentFilter = { studentId: student.id };
        }

        const submissions = await this.prisma.submission.findMany({
            where: { assessmentId, assessment: { organizationId: orgId }, ...studentFilter },
            include: {
                student: {
                    include: { user: { select: { id: true, name: true, email: true } } }
                }
            }
        });

        const submissionIds = submissions.map(s => s.id);
        const files = await this.prisma.file.findMany({
            where: { entityType: 'SUBMISSION', entityId: { in: submissionIds } }
        });

        return submissions.map(s => ({
            ...s,
            files: files.filter(f => f.entityId === s.id)
        }));
    }

    // --- Grade Calculation ---
    async calculateFinalGrade(studentId: string, sectionId?: string) {
        // If sectionId is provided, calculate for that section. 
        // Otherwise, calculate for all sections the student is enrolled in.
        const enrollments = await this.prisma.enrollment.findMany({
            where: {
                studentId,
                ...(sectionId ? { sectionId } : {})
            },
            include: {
                section: {
                    include: {
                        course: true,
                        assessments: {
                            include: {
                                grades: {
                                    where: { studentId, status: { in: ['PUBLISHED', 'FINALIZED'] } }
                                }
                            }
                        }
                    }
                }
            }
        });

        return enrollments.map(enrollment => {
            const section = enrollment.section;
            let totalPercentage = 0;
            const assessmentGrades = section.assessments.map(a => {
                const grade = a.grades[0];
                const percentage = grade ? (grade.marksObtained / a.totalMarks) * a.weightage : 0;
                totalPercentage += percentage;
                return {
                    assessmentId: a.id,
                    title: a.title,
                    type: a.type,
                    weightage: a.weightage,
                    marksObtained: grade?.marksObtained || 0,
                    totalMarks: a.totalMarks,
                    status: grade?.status || 'NOT_GRADED',
                    percentage: percentage.toFixed(2)
                };
            });

            return {
                sectionId: section.id,
                sectionName: section.name,
                courseName: section.course.name,
                finalPercentage: parseFloat(totalPercentage.toFixed(2)),
                assessments: assessmentGrades
            };
        });
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
        const isTeacher = user.role === Role.TEACHER;
        const teacherSectionFilter: Prisma.SectionWhereInput = isTeacher
            ? { teachers: { some: { userId: user.id } } }
            : {};

        const [teachers, courses, sections, students] = await Promise.all([
            isTeacher
                ? 1 // Non-manager teacher only counts themselves
                : this.prisma.teacher.count({ where: { organizationId: orgId, status: { not: TeacherStatus.DELETED } } }),
            this.prisma.course.count({
                where: {
                    organizationId: orgId,
                    ...(isTeacher ? { sections: { some: teacherSectionFilter } } : {})
                }
            }),
            this.prisma.section.count({
                where: {
                    course: { organizationId: orgId },
                    ...teacherSectionFilter
                }
            }),
            this.prisma.student.count({
                where: {
                    organizationId: orgId,
                    status: { not: StudentStatus.DELETED },
                    ...(isTeacher ? { enrollments: { some: { section: teacherSectionFilter } } } : {})
                }
            }),
        ]);

        let pendingAssessments = 0;
        if (user.role === Role.STUDENT) {
            const student = await this.prisma.student.findUnique({
                where: { userId: user.id },
                select: { id: true, enrollments: { select: { sectionId: true } } }
            });

            if (student) {
                const sectionIds = student.enrollments.map(e => e.sectionId);
                pendingAssessments = await this.prisma.assessment.count({
                    where: {
                        sectionId: { in: sectionIds },
                        submissions: { none: { studentId: student.id } }
                    }
                });
            }
        }

        return {
            TEACHERS: teachers,
            COURSES: courses,
            SECTIONS: sections,
            STUDENTS: students,
            PENDING_ASSESSMENTS: pendingAssessments,
        };
    }

    async getStudentFinalGrades(orgId: string, userId: string) {
        const student = await this.getStudentByUserId(userId);
        if (!student) return [];

        const results = await this.calculateFinalGrade(student.id);
        return results;
    }
}

