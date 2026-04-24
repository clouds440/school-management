import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Role, TeacherStatus } from '../common/enums';
import { CreateTeacherDto } from '../org/dto/create-teacher.dto';
import { UpdateTeacherDto } from '../org/dto/update-teacher.dto';
import { PaginationOptions, getPaginationOptions, formatPaginatedResponse, extractUpdateFields } from '../common/utils';
import * as bcrypt from 'bcrypt';
import { BCRYPT_ROUNDS } from '../common/utils';
import { Prisma } from '@prisma/client';
import { extractTimetableEntries } from '../common/utils';

interface JwtPayload {
  name: string | null | undefined;
  id: string;
  role?: Role | string;
  email?: string;
  organizationId?: string | null;
  userName?: string;
}

@Injectable()
export class TeacherService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async getTeachers(orgId: string, options: PaginationOptions) {
    const { skip, take, sortBy, sortOrder } = getPaginationOptions(options);

    const where: Prisma.TeacherWhereInput = {
      organizationId: orgId,
      status: { not: TeacherStatus.DELETED },
      ...(options.search
        ? {
            OR: [
              {
                user: {
                  name: { contains: options.search, mode: 'insensitive' },
                },
              },
              {
                user: {
                  email: { contains: options.search, mode: 'insensitive' },
                },
              },
              { subject: { contains: options.search, mode: 'insensitive' } },
              { department: { contains: options.search, mode: 'insensitive' } },
              {
                designation: { contains: options.search, mode: 'insensitive' },
              },
            ],
          }
        : {}),
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
      this.prisma.teacher.count({ where }),
    ]);

    return formatPaginatedResponse(
      teachers,
      totalRecords,
      options.page,
      options.limit,
    );
  }

  async getManagers(orgId: string, options: PaginationOptions) {
    const { skip, take, sortBy, sortOrder } = getPaginationOptions(options);

    const where: Prisma.TeacherWhereInput = {
      organizationId: orgId,
      user: { role: Role.ORG_MANAGER },
      status: { not: TeacherStatus.DELETED },
      ...(options.search
        ? {
            OR: [
              {
                user: {
                  name: { contains: options.search, mode: 'insensitive' },
                },
              },
              {
                user: {
                  email: { contains: options.search, mode: 'insensitive' },
                },
              },
              { subject: { contains: options.search, mode: 'insensitive' } },
              { department: { contains: options.search, mode: 'insensitive' } },
              {
                designation: { contains: options.search, mode: 'insensitive' },
              },
            ],
          }
        : {}),
    };

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

    const [managers, totalRecords] = await Promise.all([
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
      this.prisma.teacher.count({ where }),
    ]);

    return formatPaginatedResponse(
      managers,
      totalRecords,
      options.page,
      options.limit,
    );
  }

  async getTeacher(orgId: string, id: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: {
        id,
        organizationId: orgId,
        status: { not: TeacherStatus.DELETED },
      },
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

  async createTeacher(
    orgId: string,
    data: CreateTeacherDto,
    userContext: { id: string; role: string },
  ) {
    // 1. Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException(
        'A user with this email address already exists in the system',
      );
    }

    if (data.isManager && userContext.role === Role.ORG_MANAGER) {
      throw new ForbiddenException(
        'Only Organization Admins can create Managers',
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

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
            joiningDate: data.joiningDate
              ? new Date(data.joiningDate)
              : undefined,
            emergencyContact: data.emergencyContact,
            bloodGroup: data.bloodGroup,
            address: data.address,
            status: data.status,
            sections: data.sectionIds
              ? { connect: data.sectionIds.map((id) => ({ id })) }
              : undefined,
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
          if (target.includes('email'))
            throw new ConflictException('Email address already in use');
        }
      }
      if (
        error instanceof ForbiddenException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      )
        throw error;
      console.error('[CreateTeacher Error]:', error);
      throw new InternalServerErrorException(
        'An unexpected error occurred while creating the teacher account',
      );
    }
  }

  async updateTeacher(
    orgId: string,
    id: string,
    data: UpdateTeacherDto,
    userContext: { id: string; role: string },
  ) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id, organizationId: orgId },
      include: { user: true },
    });

    if (!teacher) throw new NotFoundException('Teacher not found');

    if (userContext.role === Role.ORG_MANAGER) {
      if (
        teacher.user.role === Role.ORG_ADMIN ||
        (userContext.id !== teacher.userId &&
          teacher.user.role === Role.ORG_MANAGER)
      ) {
        throw new ForbiddenException(
          'Managers cannot modify Admin or Manager profiles',
        );
      }
    }

    const userFields = ['name', 'email', 'phone', 'password'];
    const teacherFields = [
      'salary',
      'subject',
      'education',
      'designation',
      'department',
      'emergencyContact',
      'bloodGroup',
      'address',
      'status',
    ];

    const { userData, entityData: teacherData } = await extractUpdateFields(
      data as unknown as Record<string, unknown>,
      userFields,
      teacherFields,
      teacher.user.email,
    );

    if (data.isManager !== undefined) {
      userData.role = data.isManager ? Role.ORG_MANAGER : Role.TEACHER;
    }

    if (data.sectionIds !== undefined) {
      teacherData.sections = { set: data.sectionIds.map((id) => ({ id })) };
    }

    if (data.joiningDate) {
      const date = new Date(data.joiningDate);
      if (!isNaN(date.getTime())) {
        teacherData.joiningDate = date;
      }
    }

    const updatedTeacher = await this.prisma.$transaction(async (tx) => {
      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: teacher.userId },
          data: userData,
        });
      }

      if (Object.keys(teacherData).length > 0) {
        await tx.teacher.update({
          where: { id },
          data: teacherData,
        });
      }

      return tx.teacher.findUnique({
        where: { id },
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
          sections: { include: { course: true } },
        },
      });
    });

    // --- Persistent Notifications ---
    if (data.status && data.status !== teacher.status) {
      await this.notifications.createNotification({
        userId: teacher.userId,
        title: 'Account Status Updated',
        body: `Your account status has been changed to ${data.status.toLowerCase()}.`,
        type: 'USER_STATUS_CHANGE',
        actionUrl: '/profile',
        metadata: { oldStatus: teacher.status, newStatus: data.status },
      });
    }

    if (
      data.isManager !== undefined &&
      (data.isManager ? Role.ORG_MANAGER : Role.TEACHER) !== teacher.user.role
    ) {
      await this.notifications.createNotification({
        userId: teacher.userId,
        title: 'Role Updated',
        body: `Your administrative role has been updated to ${data.isManager ? 'Manager' : 'Teacher'}.`,
        type: 'USER_ROLE_CHANGE',
        actionUrl: '#',
        metadata: {
          oldRole: teacher.user.role,
          newRole: data.isManager ? Role.ORG_MANAGER : Role.TEACHER,
        },
      });
    }

    return updatedTeacher;
  }

  async deleteTeacher(
    orgId: string,
    id: string,
    userContext: { id: string; role: string },
  ) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id, organizationId: orgId },
      include: { user: true },
    });

    if (!teacher) throw new NotFoundException('Teacher not found');

    if (userContext.role === Role.ORG_MANAGER) {
      if (
        teacher.user.role === Role.ORG_ADMIN ||
        teacher.user.role === Role.ORG_MANAGER
      ) {
        throw new ForbiddenException(
          'Managers cannot delete Admin or Manager profiles',
        );
      }
    }

    await this.prisma.teacher.update({
      where: { id },
      data: { status: TeacherStatus.DELETED },
    });

    return { message: 'Teacher deleted successfully' };
  }

  async getTeacherByUserId(userId: string) {
    return this.prisma.teacher.findUnique({ where: { userId } });
  }

  async getTeacherProfile(orgId: string, user: JwtPayload) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: user.id },
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
        sections: { include: { course: true } },
      },
    });
    if (!teacher) throw new NotFoundException('Teacher profile not found');
    return teacher;
  }

  async getTeacherTimetable(orgId: string, userId: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { userId, organizationId: orgId },
    });
    if (!teacher) return [];
    
    const sections = await this.prisma.section.findMany({
      where: { teachers: { some: { id: teacher.id } } },
      include: {
        course: { select: { name: true } },
        schedules: { select: { id: true, day: true, startTime: true, endTime: true, room: true } },
      },
    });

    return extractTimetableEntries(sections);
  }
}
