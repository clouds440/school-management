import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Role, OrgStatus, TeacherStatus, StudentStatus, MailStatus } from '../common/enums';
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
import {
  getPaginationOptions,
  formatPaginatedResponse,
  extractUpdateFields,
  BCRYPT_ROUNDS,
  PaginationOptions,
} from '../common/utils';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { AttendanceRecordDto } from './dto/mark-attendance.dto';

interface JwtPayload {
  name: string | null | undefined;
  id: string;
  role?: Role | string;
  email?: string;
  organizationId?: string | null;
  userName?: string;
}

export interface DashboardInsightCard {
  id: string;
  label: string;
  value: string;
  detail?: string;
  href?: string;
  tone?: 'default' | 'info' | 'success' | 'warning' | 'danger';
}

export interface DashboardInsightItem {
  id: string;
  title: string;
  description?: string;
  meta?: string;
  href?: string;
  badge?: string;
  tone?: 'default' | 'info' | 'success' | 'warning' | 'danger';
}

export interface DashboardInsightGroup {
  id: string;
  title: string;
  description?: string;
  items: DashboardInsightItem[];
}

export interface DashboardInsightActivity {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  href?: string;
  tone?: 'default' | 'info' | 'success' | 'warning' | 'danger';
}

export interface DashboardInsightsResponse {
  role: string;
  headline: {
    eyebrow?: string;
    title: string;
    subtitle: string;
  };
  summaryCards: DashboardInsightCard[];
  spotlight: DashboardInsightItem | null;
  groups: DashboardInsightGroup[];
  recentActivity: DashboardInsightActivity[];
}

@Injectable()
export class OrgService {
  constructor(
    private readonly filesService: FilesService,
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

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

    const publicUrl = await this.filesService.replaceFile(org.logoUrl, file);

    // Save new file record via FilesService (for audit trail)
    await this.filesService.saveFile(
      { orgId, entityType: 'orgLogo', entityId: orgId },
      file,
      uploadedBy,
    );

    // Update org with new logo URL and bump cache-buster timestamp
    // Also update the org admin's avatarUrl with the same logo URL
    const result = await this.prisma.$transaction(async (tx) => {
      const updatedOrg = await tx.organization.update({
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

      // Update the org admin's avatarUrl with the organization logo
      await tx.user.updateMany({
        where: {
          organizationId: orgId,
          role: Role.ORG_ADMIN,
        },
        data: {
          avatarUrl: publicUrl,
          avatarUpdatedAt: new Date(),
        },
      });

      return updatedOrg;
    });

    return result;
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

    const publicUrl = await this.filesService.replaceFile(user.avatarUrl, file);

    // Save new file record via FilesService (for audit trail)
    await this.filesService.saveFile(
      {
        orgId: user.organizationId ?? 'system',
        entityType: 'userAvatar',
        entityId: user.id,
      },
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

  // --- Teachers ---
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
            ],
          }
        : {}),
    };

    let orderBy: Prisma.TeacherOrderByWithRelationInput = {};
    if (sortBy.startsWith('user.')) {
      const field = sortBy.split('.')[1];
      orderBy = { user: { [field]: sortOrder } };
    } else {
      orderBy = { user: { name: sortOrder } };
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
          // Add other unique fields if necessary
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

  // --- Courses ---
  async getCourses(orgId: string, options: PaginationOptions = {}) {
    const { skip, take, sortBy, sortOrder } = getPaginationOptions({
      ...options,
      sortBy: options.sortBy || 'name',
      sortOrder: options.sortOrder || 'asc',
    });

    const where: Prisma.CourseWhereInput = {
      organizationId: orgId,
      ...(options.my && options.userId
        ? {
            sections: {
              some: {
                teachers: {
                  some: { userId: options.userId },
                },
              },
            },
          }
        : {}),
      ...(options.search
        ? {
            OR: [
              { name: { contains: options.search, mode: 'insensitive' } },
              {
                description: { contains: options.search, mode: 'insensitive' },
              },
            ],
          }
        : {}),
    };

    const [courses, totalRecords] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take,
        include: { sections: true },
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.course.count({ where }),
    ]);

    return formatPaginatedResponse(
      courses,
      totalRecords,
      options.page,
      options.limit,
    );
  }

  async createCourse(orgId: string, data: CreateCourseDto) {
    return this.prisma.course.create({
      data: {
        ...data,
        organizationId: orgId,
      },
    });
  }

  async updateCourse(orgId: string, id: string, data: UpdateCourseDto) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course || course.organizationId !== orgId) {
      throw new NotFoundException('Course not found');
    }
    return this.prisma.course.update({
      where: { id },
      data,
    });
  }

  async deleteCourse(orgId: string, id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { sections: true },
    });
    if (!course || course.organizationId !== orgId) {
      throw new NotFoundException('Course not found');
    }
    if (course.sections.length > 0) {
      throw new BadRequestException(
        'Cannot delete course with active sections',
      );
    }
    return this.prisma.course.delete({ where: { id } });
  }

  // --- Sections ---
  async getSections(orgId: string, options: PaginationOptions) {
    const { skip, take, sortBy, sortOrder } = getPaginationOptions({
      ...options,
      sortBy: options.sortBy || 'createdAt',
      sortOrder: options.sortOrder || 'desc',
    });

    const where: Prisma.SectionWhereInput = {
      course: { organizationId: orgId },
      ...(options.my && options.userId
        ? {
            OR: [
              { teachers: { some: { userId: options.userId } } },
              {
                enrollments: { some: { student: { userId: options.userId } } },
              },
            ],
          }
        : {}),
      ...(options.search
        ? {
            OR: [
              { name: { contains: options.search, mode: 'insensitive' } },
              { semester: { contains: options.search, mode: 'insensitive' } },
              { year: { contains: options.search, mode: 'insensitive' } },
              { room: { contains: options.search, mode: 'insensitive' } },
              {
                course: {
                  name: { contains: options.search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
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
          teachers: {
            include: { user: { select: { email: true, name: true } } },
          },
          enrollments: {
            include: {
              student: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
          _count: { select: { enrollments: true } },
        },
        orderBy,
      }),
      this.prisma.section.count({ where }),
    ]);

    const formattedSections = sections.map((s) => ({
      ...s,
      students: s.enrollments.map((e) => ({
        ...e.student,
        user: e.student.user,
      })),
      studentsCount: s._count?.enrollments || 0,
    }));

    return formatPaginatedResponse(
      formattedSections,
      totalRecords,
      options.page,
      options.limit,
    );
  }

  private async getAuthorizedSection(
    orgId: string,
    sectionId: string,
    user: JwtPayload,
  ) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        course: true,
        teachers: { select: { id: true, userId: true } },
        enrollments: { select: { studentId: true, student: { select: { userId: true } } } },
      },
    });

    if (!section || section.course.organizationId !== orgId) {
      throw new NotFoundException('Section not found');
    }

    if (user.role === Role.TEACHER) {
      const isAssigned = section.teachers.some((teacher) => teacher.userId === user.id);
      if (!isAssigned) {
        throw new ForbiddenException(
          'You are not assigned to this section.',
        );
      }
    }

    if (user.role === Role.STUDENT) {
      const isEnrolled = section.enrollments.some(
        (enrollment) => enrollment.student.userId === user.id,
      );
      if (!isEnrolled) {
        throw new ForbiddenException(
          'You are not enrolled in this section.',
        );
      }
    }

    return section;
  }

  private async assertAttendanceSectionAccess(
    orgId: string,
    sectionId: string,
    user: JwtPayload,
  ) {
    return this.getAuthorizedSection(orgId, sectionId, user);
  }

  private async validateAttendanceSchedule(
    sectionId: string,
    scheduleId?: string,
  ) {
    if (!scheduleId) return null;

    const schedule = await this.prisma.sectionSchedule.findUnique({
      where: { id: scheduleId },
      select: { id: true, sectionId: true },
    });

    if (!schedule || schedule.sectionId !== sectionId) {
      throw new BadRequestException(
        'The provided schedule does not belong to this section.',
      );
    }

    return schedule;
  }

  private async assertStudentsBelongToSection(
    sectionId: string,
    studentIds: string[],
  ) {
    if (studentIds.length === 0) return;

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        sectionId,
        studentId: { in: studentIds },
      },
      select: { studentId: true },
    });

    const enrolledIds = new Set(enrollments.map((enrollment) => enrollment.studentId));
    const invalidStudentId = studentIds.find((studentId) => !enrolledIds.has(studentId));
    if (invalidStudentId) {
      throw new BadRequestException(
        'Attendance can only be marked for students enrolled in this section.',
      );
    }
  }

  async getSection(orgId: string, id: string, user: JwtPayload) {
    await this.getAuthorizedSection(orgId, id, user);

    const section = await this.prisma.section.findUnique({
      where: { id },
      include: {
        course: true,
        teachers: {
          include: { user: { select: { id: true, email: true, name: true } } },
        },
        enrollments: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                    avatarUpdatedAt: true,
                  },
                },
              },
            },
          },
        },
        assessments: true,
        schedules: true,
      },
    });

    if (!section || section.course.organizationId !== orgId) {
      throw new NotFoundException('Section not found');
    }

    const enrollments =
      user.role === Role.STUDENT
        ? section.enrollments.filter((enrollment) => enrollment.student.user.id === user.id)
        : section.enrollments;

    return {
      ...section,
      enrollments,
      students: enrollments.map((e) => ({
        ...e.student,
        user: e.student.user,
      })),
      studentsCount: enrollments.length,
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
      ...(options.sectionId
        ? {
            enrollments: {
              some: { sectionId: options.sectionId },
            },
          }
        : {}),
      ...(options.my && options.userId
        ? {
            enrollments: {
              some: {
                section: {
                  teachers: {
                    some: { userId: options.userId },
                  },
                },
              },
            },
          }
        : {}),
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
              {
                registrationNumber: {
                  contains: options.search,
                  mode: 'insensitive',
                },
              },
              { rollNumber: { contains: options.search, mode: 'insensitive' } },
              { major: { contains: options.search, mode: 'insensitive' } },
              { department: { contains: options.search, mode: 'insensitive' } },
            ],
          }
        : {}),
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
      this.prisma.student.count({ where }),
    ]);

    return formatPaginatedResponse(
      students,
      totalRecords,
      options.page,
      options.limit,
    );
  }

  async getStudent(orgId: string, id: string) {
    const student = await this.prisma.student.findFirst({
      where: {
        id,
        organizationId: orgId,
        status: { not: StudentStatus.DELETED },
      },
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
                teachers: { include: { user: true } },
              },
            },
          },
        },
      },
    });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async createStudent(
    orgId: string,
    data: CreateStudentDto,
    userContext: { name?: string | null; email: string },
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException(
        'A user with this email address already exists in the system',
      );
    }

    const existingRegNum = await this.prisma.student.findFirst({
      where: {
        organizationId: orgId,
        registrationNumber: data.registrationNumber,
      },
    });

    if (existingRegNum) {
      throw new ConflictException(
        `Registration number "${data.registrationNumber}" is already assigned to another student in this organization`,
      );
    }

    const existingRollNum = await this.prisma.student.findFirst({
      where: { organizationId: orgId, rollNumber: data.rollNumber },
    });

    if (existingRollNum) {
      throw new ConflictException(
        `Roll number "${data.rollNumber}" is already assigned to another student in this organization`,
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

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
            admissionDate: data.admissionDate
              ? new Date(data.admissionDate)
              : undefined,
            graduationDate: data.graduationDate
              ? new Date(data.graduationDate)
              : undefined,
            emergencyContact: data.emergencyContact,
            bloodGroup: data.bloodGroup,
            gender: data.gender,
            feePlan: data.feePlan,
            status: data.status,
            enrollments: data.sectionIds
              ? { create: data.sectionIds.map((sectionId) => ({ sectionId })) }
              : undefined,
            updatedBy: userContext.name || userContext.email,
          },
          include: {
            user: { select: { email: true, name: true, phone: true } },
            enrollments: { include: { section: true } },
          },
        });

        return student;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = (error.meta?.target as string[]) || [];
          if (target.includes('email'))
            throw new ConflictException('Email address already in use');
          if (target.includes('registrationNumber'))
            throw new ConflictException('Registration number already in use');
          if (target.includes('rollNumber'))
            throw new ConflictException('Roll number already in use');
        }
      }
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      )
        throw error;
      console.error('[CreateStudent Error]:', error);
      throw new InternalServerErrorException(
        'An unexpected error occurred while creating the student record',
      );
    }
  }

  async updateStudent(
    orgId: string,
    id: string,
    data: UpdateStudentDto,
    userContext: { role: Role; name?: string | null; email: string },
  ) {
    const student = await this.prisma.student.findFirst({
      where: { id, organizationId: orgId },
      include: { user: true },
    });

    if (!student) throw new NotFoundException('Student not found');

    const userFields = ['name', 'email', 'phone', 'password'];
    const studentFields = [
      'registrationNumber',
      'rollNumber',
      'fatherName',
      'fee',
      'age',
      'address',
      'major',
      'department',
      'admissionDate',
      'graduationDate',
      'emergencyContact',
      'bloodGroup',
      'gender',
      'feePlan',
      'status',
    ];

    const { userData, entityData: studentData } = await extractUpdateFields(
      data as unknown as Record<string, unknown>,
      userFields,
      studentFields,
      student.user.email,
    );

    // --- Role-based Field Locking ---
    const isOrgAdmin = userContext.role === Role.ORG_ADMIN;
    if (!isOrgAdmin) {
      delete studentData.registrationNumber;
      delete studentData.rollNumber;
    }

    if (
      studentData.registrationNumber &&
      studentData.registrationNumber !== student.registrationNumber
    ) {
      const existing = await this.prisma.student.findFirst({
        where: {
          organizationId: orgId,
          registrationNumber: studentData.registrationNumber,
          id: { not: id },
        },
      });
      if (existing)
        throw new BadRequestException('Registration number already in use');
    }

    if (
      studentData.rollNumber &&
      studentData.rollNumber !== student.rollNumber
    ) {
      const existing = await this.prisma.student.findFirst({
        where: {
          organizationId: orgId,
          rollNumber: studentData.rollNumber,
          id: { not: id },
        },
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

    const updatedStudent = await this.prisma.$transaction(async (tx) => {
      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: student.userId },
          data: userData,
        });
      }

      if (Object.keys(studentData).length > 0) {
        studentData.updatedBy = userContext.name || userContext.email;
        await tx.student.update({
          where: { id },
          data: studentData,
        });
      }

      if (data.sectionIds !== undefined) {
        await tx.enrollment.deleteMany({ where: { studentId: id } });
        if (data.sectionIds.length > 0) {
          await tx.enrollment.createMany({
            data: data.sectionIds.map((sectionId) => ({
              studentId: id,
              sectionId,
            })),
          });
        }
      }

      return tx.student.findUnique({
        where: { id },
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
          enrollments: { include: { section: true } },
        },
      });
    });

    // --- Persistent Notifications ---
    if (data.status && data.status !== student.status) {
      await this.notifications.createNotification({
        userId: student.userId,
        title: 'Account Status Updated',
        body: `Your account status has been changed to ${data.status.toLowerCase()}.`,
        type: 'USER_STATUS_CHANGE',
        actionUrl: '/profile',
        metadata: { oldStatus: student.status, newStatus: data.status },
      });
    }

    return updatedStudent;
  }

  async deleteStudent(orgId: string, id: string) {
    const student = await this.prisma.student.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!student) throw new NotFoundException('Student not found');

    await this.prisma.student.update({
      where: { id },
      data: { status: StudentStatus.DELETED },
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
          enrollments: { include: { section: { include: { course: true } } } },
        },
      });
      if (!student) throw new NotFoundException('Student profile not found');
      return student;
    }

    if (user.role === Role.TEACHER || user.role === Role.ORG_MANAGER) {
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

    throw new ForbiddenException('Profile access not allowed for this role');
  }

  async updateProfile(
    orgId: string,
    user: JwtPayload,
    data: Partial<UpdateStudentDto | UpdateTeacherDto>,
  ) {
    if (user.role === Role.STUDENT) {
      const student = await this.prisma.student.findUnique({
        where: { userId: user.id },
      });
      if (!student) throw new NotFoundException('Student profile not found');

      // Strictly Allow only these fields for students
      const allowedFields = [
        'phone',
        'fatherName',
        'age',
        'address',
        'emergencyContact',
        'bloodGroup',
        'password',
      ];
      const filteredData = Object.keys(data)
        .filter((key) => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = data[key];
          return obj;
        }, {});

      return this.updateStudent(orgId, student.id, filteredData, {
        role: Role.STUDENT,
        name: user.name,
        email: user.email!,
      });
    }

    if (user.role === Role.TEACHER || user.role === Role.ORG_MANAGER) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId: user.id },
      });
      if (!teacher) throw new NotFoundException('Teacher profile not found');

      // Standard protection for teachers updating their own profile
      const allowedFields = [
        'emergencyContact',
        'bloodGroup',
        'address',
        'password',
      ];
      const filteredData = Object.keys(data)
        .filter((key) => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = data[key];
          return obj;
        }, {});

      return this.updateTeacher(orgId, teacher.id, filteredData, {
        id: user.id,
        role: user.role,
      });
    }

    throw new ForbiddenException('Profile update not allowed for this role');
  }

  // --- Assessments ---
  async createAssessment(
    orgId: string,
    data: CreateAssessmentDto,
    user: JwtPayload,
  ) {
    // Org Admins cannot create assessments (only view)
    if (user.role === Role.ORG_ADMIN) {
      throw new ForbiddenException(
        'Organization Admins are not authorized to create assessments.',
      );
    }

    // Permission check: Manager/Teacher must be assigned to the section
    if (user.role === Role.TEACHER || user.role === Role.ORG_MANAGER) {
      const assignment = await this.prisma.section.findFirst({
        where: {
          id: data.sectionId,
          teachers: { some: { userId: user.id } },
        },
      });
      if (!assignment) {
        throw new ForbiddenException(
          'You are not assigned to this section and cannot create assessments for it.',
        );
      }
    }

    // Validate total weightage for the section
    const sectionAssessments = await this.prisma.assessment.findMany({
      where: { sectionId: data.sectionId },
    });

    const totalWeightage = sectionAssessments.reduce(
      (sum, a) => sum + a.weightage,
      0,
    );
    if (totalWeightage + data.weightage > 100) {
      throw new BadRequestException(
        `Total weightage for this section cannot exceed 100%. Current total: ${totalWeightage}%`,
      );
    }

    const assessment = await this.prisma.assessment.create({
      data: {
        ...data,
        organizationId: orgId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });

    const enrollments = await this.prisma.enrollment.findMany({
      where: { sectionId: data.sectionId },
      include: { student: { select: { userId: true } } },
    });

    for (const e of enrollments) {
      await this.notifications.createNotification({
        userId: e.student.userId,
        title: 'New Assessment Created',
        body: `A new assessment "${assessment.title}" has been added.`,
        actionUrl: `/sections/${data.sectionId}/assessments/${assessment.id}`,
        type: 'ASSESSMENT_CREATED',
      });
    }

    return assessment;
  }

  async getAssessments(
    orgId: string,
    user: { id: string; role: string | Role },
    filters: { sectionId?: string; courseId?: string },
  ) {
    let allowedSectionIds: string[] | undefined = undefined;

    if (user.role === Role.STUDENT) {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { student: { userId: user.id } },
        select: { sectionId: true },
      });
      allowedSectionIds = enrollments.map((e) => e.sectionId);

      // If a specific section filter was provided, ensure it's within the allowed sections
      if (filters.sectionId && !allowedSectionIds.includes(filters.sectionId)) {
        return []; // unauthorized intersection returns empty
      }
    }

    const whereClause: import('@prisma/client').Prisma.AssessmentWhereInput = {
      organizationId: orgId,
    };
    if (filters.courseId) whereClause.courseId = filters.courseId;

    if (user.role === Role.STUDENT) {
      whereClause.sectionId = filters.sectionId
        ? filters.sectionId
        : allowedSectionIds
          ? { in: allowedSectionIds }
          : undefined;
    } else if (user.role === Role.TEACHER) {
      // Restriction for Teachers: only assigned sections
      const assignedSections = await this.prisma.section.findMany({
        where: { teachers: { some: { userId: user.id } } },
        select: { id: true },
      });
      const assignedIds = assignedSections.map((s) => s.id);

      if (filters.sectionId) {
        if (!assignedIds.includes(filters.sectionId)) {
          throw new ForbiddenException(
            'You are not authorized to view assessments for this section.',
          );
        }
        whereClause.sectionId = filters.sectionId;
      } else {
        whereClause.sectionId = { in: assignedIds };
      }
    } else if (user.role === Role.ORG_MANAGER) {
      // Managers can view all assessments in the org (no restriction like Teachers)
      if (filters.sectionId) whereClause.sectionId = filters.sectionId;
    } else if (filters.sectionId) {
      whereClause.sectionId = filters.sectionId;
    }

    return this.prisma.assessment.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { grades: true, submissions: true },
        },
        section: {
          select: {
            id: true,
            name: true,
            teachers: { select: { user: { select: { name: true } } } },
          },
        },
        ...(user.role === Role.STUDENT
          ? {
              grades: {
                where: { student: { userId: user.id } },
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateAssessment(
    orgId: string,
    id: string,
    data: UpdateAssessmentDto,
    user: JwtPayload,
  ) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
    });
    if (!assessment || assessment.organizationId !== orgId) {
      throw new NotFoundException('Assessment not found');
    }

    // Permission check: Manager/Teacher must be assigned to the section
    if (user.role === Role.TEACHER || user.role === Role.ORG_MANAGER) {
      const assignment = await this.prisma.section.findFirst({
        where: {
          id: assessment.sectionId,
          teachers: { some: { userId: user.id } },
        },
      });
      if (!assignment) {
        throw new ForbiddenException(
          'You are not authorized to modify this assessment.',
        );
      }
    }

    if (data.weightage !== undefined) {
      const sectionAssessments = await this.prisma.assessment.findMany({
        where: { sectionId: assessment.sectionId, id: { not: id } },
      });

      const totalWeightage = sectionAssessments.reduce(
        (sum, a) => sum + a.weightage,
        0,
      );
      if (totalWeightage + data.weightage > 100) {
        throw new BadRequestException(
          `Total weightage for this section cannot exceed 100%. Current total: ${totalWeightage}%`,
        );
      }
    }

    return this.prisma.assessment.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });
  }

  async deleteAssessment(orgId: string, id: string, user: JwtPayload) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
    });
    if (!assessment || assessment.organizationId !== orgId) {
      throw new NotFoundException('Assessment not found');
    }

    // Permission check: Manager/Teacher must be assigned to the section
    if (user.role === Role.TEACHER || user.role === Role.ORG_MANAGER) {
      const assignment = await this.prisma.section.findFirst({
        where: {
          id: assessment.sectionId,
          teachers: { some: { userId: user.id } },
        },
      });
      if (!assignment) {
        throw new ForbiddenException(
          'You are not authorized to delete this assessment.',
        );
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
        ...studentFilter,
      },
      include: {
        student: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  async updateGrade(
    orgId: string,
    assessmentId: string,
    studentId: string,
    data: UpdateGradeDto,
    userId: string,
    userRole: Role,
  ) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
    });
    if (!assessment || assessment.organizationId !== orgId) {
      throw new NotFoundException('Assessment not found');
    }

    const grade = await this.prisma.grade.findUnique({
      where: { assessmentId_studentId: { assessmentId, studentId } },
    });

    if (grade && grade.status === 'FINALIZED' && userRole !== Role.ORG_ADMIN) {
      throw new ForbiddenException(
        'Only Org Admin can update finalized grades',
      );
    }

    // Permission check: Must be assigned to the section if not Org Admin
    if (userRole === Role.TEACHER || userRole === Role.ORG_MANAGER) {
      const assignment = await this.prisma.section.findFirst({
        where: {
          id: assessment.sectionId,
          teachers: { some: { userId } },
        },
      });
      if (!assignment) {
        throw new ForbiddenException(
          'You are not assigned to this section and cannot update grades for it.',
        );
      }
    }

    if (data.marksObtained > assessment.totalMarks) {
      throw new BadRequestException(
        `Marks obtained (${data.marksObtained}) cannot exceed total marks (${assessment.totalMarks})`,
      );
    }

    const result = await this.prisma.grade.upsert({
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
      },
    });

    if (data.status === 'PUBLISHED' || data.status === 'FINALIZED') {
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
      });
      if (student) {
        await this.notifications.createNotification({
          userId: student.userId,
          title: 'Assessment Graded',
          body: `Your grade for "${assessment.title}" has been ${data.status.toLowerCase()}.`,
          actionUrl: `/sections/${assessment.sectionId}/assessments/${assessment.id}`,
          type: 'ASSESSMENT_GRADED',
        });
      }
    }

    return result;
  }

  async publishGrades(orgId: string, assessmentId: string) {
    return this.prisma.grade.updateMany({
      where: { assessmentId, assessment: { organizationId: orgId } },
      data: { status: 'PUBLISHED' },
    });
  }

  async finalizeGrades(orgId: string, assessmentId: string) {
    return this.prisma.grade.updateMany({
      where: { assessmentId, assessment: { organizationId: orgId } },
      data: { status: 'FINALIZED' },
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
      where: { entityType: 'ASSESSMENT', entityId: id },
    });

    return { ...assessment, files };
  }

  // --- Submissions ---
  async createSubmission(
    orgId: string,
    studentId: string,
    data: CreateSubmissionDto & { assessmentId: string },
  ) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: data.assessmentId },
    });
    if (!assessment || assessment.organizationId !== orgId) {
      throw new NotFoundException('Assessment not found');
    }

    if (assessment.dueDate && new Date() > assessment.dueDate) {
      throw new BadRequestException('Submission deadline has passed');
    }

    const submission = await this.prisma.submission.create({
      data: {
        ...data,
        studentId,
      },
    });

    // 1. Notify teachers of the new submission
    const section = await this.prisma.section.findUnique({
      where: { id: assessment.sectionId },
      include: {
        teachers: { select: { userId: true } },
        enrollments: { select: { studentId: true } },
      },
    });

    const studentData = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { user: { select: { name: true } } },
    });

    if (section && studentData) {
      for (const teacher of section.teachers) {
        await this.notifications.createNotification({
          userId: teacher.userId,
          title: 'New Submission',
          body: `${studentData.user.name} has submitted their work for "${assessment.title}".`,
          type: 'SUBMISSION_CREATED',
          actionUrl: `/sections/${assessment.sectionId}/assessments/${assessment.id}`,
        });
      }

      // 2. Check if ALL students in the section have submitted
      const submissionCount = await this.prisma.submission.count({
        where: { assessmentId: assessment.id },
      });

      if (submissionCount === section.enrollments.length) {
        for (const teacher of section.teachers) {
          await this.notifications.createNotification({
            userId: teacher.userId,
            title: 'Assessment Complete',
            body: `All students in "${section.name}" have submitted their work for "${assessment.title}".`,
            type: 'ASSESSMENT_COMPLETED_ALL',
            actionUrl: `/sections/${assessment.sectionId}/assessments/${assessment.id}`,
          });
        }
      }
    }

    return submission;
  }

  async getSubmissions(orgId: string, assessmentId: string, user?: JwtPayload) {
    let studentFilter = {};
    if (user && user.role === Role.STUDENT) {
      const student = await this.getStudentByUserId(user.id);
      if (student) studentFilter = { studentId: student.id };
    }

    const submissions = await this.prisma.submission.findMany({
      where: {
        assessmentId,
        assessment: { organizationId: orgId },
        ...studentFilter,
      },
      include: {
        student: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    const submissionIds = submissions.map((s) => s.id);
    const files = await this.prisma.file.findMany({
      where: { entityType: 'SUBMISSION', entityId: { in: submissionIds } },
    });

    return submissions.map((s) => ({
      ...s,
      files: files.filter((f) => f.entityId === s.id),
    }));
  }

  // --- Grade Calculation ---
  async calculateFinalGrade(studentId: string, sectionId?: string) {
    // If sectionId is provided, calculate for that section.
    // Otherwise, calculate for all sections the student is enrolled in.
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId,
        ...(sectionId ? { sectionId } : {}),
      },
      include: {
        section: {
          include: {
            course: true,
            assessments: {
              include: {
                grades: {
                  where: {
                    studentId,
                    status: { in: ['PUBLISHED', 'FINALIZED'] },
                  },
                },
              },
            },
          },
        },
      },
    });

    return enrollments.map((enrollment) => {
      const section = enrollment.section;
      let totalPercentage = 0;
      const assessmentGrades = section.assessments.map((a) => {
        const grade = a.grades[0];
        const percentage = grade
          ? (grade.marksObtained / a.totalMarks) * a.weightage
          : 0;
        totalPercentage += percentage;
        return {
          assessmentId: a.id,
          title: a.title,
          type: a.type,
          weightage: a.weightage,
          marksObtained: grade?.marksObtained || 0,
          totalMarks: a.totalMarks,
          status: grade?.status || 'NOT_GRADED',
          percentage: percentage.toFixed(2),
        };
      });

      return {
        sectionId: section.id,
        sectionName: section.name,
        courseName: section.course.name,
        finalPercentage: parseFloat(totalPercentage.toFixed(2)),
        assessments: assessmentGrades,
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
      },
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
        : this.prisma.teacher.count({
            where: {
              organizationId: orgId,
              status: { not: TeacherStatus.DELETED },
            },
          }),
      this.prisma.course.count({
        where: {
          organizationId: orgId,
          ...(isTeacher ? { sections: { some: teacherSectionFilter } } : {}),
        },
      }),
      this.prisma.section.count({
        where: {
          course: { organizationId: orgId },
          ...teacherSectionFilter,
        },
      }),
      this.prisma.student.count({
        where: {
          organizationId: orgId,
          status: { not: StudentStatus.DELETED },
          ...(isTeacher
            ? { enrollments: { some: { section: teacherSectionFilter } } }
            : {}),
        },
      }),
    ]);

    let pendingAssessments = 0;
    if (user.role === Role.STUDENT) {
      const student = await this.prisma.student.findUnique({
        where: { userId: user.id },
        select: { id: true, enrollments: { select: { sectionId: true } } },
      });

      if (student) {
        const sectionIds = student.enrollments.map((e) => e.sectionId);
        pendingAssessments = await this.prisma.assessment.count({
          where: {
            sectionId: { in: sectionIds },
            submissions: { none: { studentId: student.id } },
          },
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

  private formatPercent(value: number, fractionDigits = 0) {
    if (!Number.isFinite(value)) return '0%';
    return `${value.toFixed(fractionDigits)}%`;
  }

  private toDateOnly(value: Date) {
    return value.toISOString().slice(0, 10);
  }

  private countWeekdayOccurrences(start: Date, end: Date, targetDay: number) {
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0);

    let count = 0;
    while (cursor <= endDate) {
      if (cursor.getDay() === targetDay) count += 1;
      cursor.setDate(cursor.getDate() + 1);
    }

    return count;
  }

  private getAttendanceCoverage(
    schedules: { id: string; day: number }[],
    sessions: { scheduleId: string | null; date: Date }[],
    start: Date,
    end: Date,
  ) {
    const expected = schedules.reduce(
      (total, schedule) => total + this.countWeekdayOccurrences(start, end, schedule.day),
      0,
    );

    const uniqueSessions = new Set(
      sessions
        .filter((session) => session.scheduleId)
        .map((session) => `${session.scheduleId}:${this.toDateOnly(session.date)}`),
    );

    const actual = uniqueSessions.size;
    return {
      actual,
      expected,
      percent: expected > 0 ? (actual / expected) * 100 : 100,
    };
  }

  private getUpcomingScheduleOccurrences(
    schedules: {
      id: string;
      day: number;
      startTime: string;
      endTime: string;
      room?: string | null;
      section: { id: string; name: string; course: { name: string }; room?: string | null };
    }[],
    limit = 5,
  ) {
    const now = new Date();
    const occurrences = schedules.map((schedule) => {
      const occurrenceDate = new Date(now);
      occurrenceDate.setHours(0, 0, 0, 0);
      const delta = (schedule.day - occurrenceDate.getDay() + 7) % 7;
      occurrenceDate.setDate(occurrenceDate.getDate() + delta);

      const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
      const startsAt = new Date(occurrenceDate);
      startsAt.setHours(startHour, startMinute, 0, 0);

      if (startsAt <= now) {
        startsAt.setDate(startsAt.getDate() + 7);
      }

      return {
        scheduleId: schedule.id,
        sectionId: schedule.section.id,
        sectionName: schedule.section.name,
        courseName: schedule.section.course.name,
        room: schedule.room || schedule.section.room || null,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        startsAt,
      };
    });

    return occurrences
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
      .slice(0, limit);
  }

  private getMissingScheduledSessions(
    schedules: {
      id: string;
      day: number;
      startTime: string;
      endTime: string;
      section: { id: string; name: string; course: { name: string } };
    }[],
    existingSessions: { scheduleId: string | null; date: Date }[],
    daysBack: number,
    limit = 5,
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - daysBack);

    const existingKeys = new Set(
      existingSessions
        .filter((session) => session.scheduleId)
        .map((session) => `${session.scheduleId}:${this.toDateOnly(session.date)}`),
    );

    const missing: {
      scheduleId: string;
      date: string;
      sectionId: string;
      sectionName: string;
      courseName: string;
      startTime: string;
      endTime: string;
    }[] = [];

    schedules.forEach((schedule) => {
      const cursor = new Date(start);
      while (cursor <= today) {
        if (cursor.getDay() === schedule.day) {
          const dateKey = this.toDateOnly(cursor);
          if (!existingKeys.has(`${schedule.id}:${dateKey}`)) {
            missing.push({
              scheduleId: schedule.id,
              date: dateKey,
              sectionId: schedule.section.id,
              sectionName: schedule.section.name,
              courseName: schedule.section.course.name,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
            });
          }
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    });

    return missing
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, limit);
  }

  private sortActivities(activities: DashboardInsightActivity[], limit = 6) {
    return activities
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, limit);
  }

  private async buildOrgAdminInsights(
    orgId: string,
    user: JwtPayload,
  ): Promise<DashboardInsightsResponse> {
    const now = new Date();
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(now.getDate() - 13);

    const [
      teachers,
      students,
      courses,
      sections,
      schedules,
      attendanceSessions,
      upcomingAssessments,
      recentTeachers,
      recentStudents,
      recentAssessments,
      recentAttendance,
      openMailCount,
    ] = await Promise.all([
      this.prisma.teacher.count({
        where: { organizationId: orgId, status: { not: TeacherStatus.DELETED } },
      }),
      this.prisma.student.count({
        where: { organizationId: orgId, status: { not: StudentStatus.DELETED } },
      }),
      this.prisma.course.count({ where: { organizationId: orgId } }),
      this.prisma.section.findMany({
        where: { course: { organizationId: orgId } },
        include: {
          course: { select: { name: true } },
          teachers: { select: { id: true } },
          _count: { select: { enrollments: true } },
        },
      }),
      this.prisma.sectionSchedule.findMany({
        where: { section: { course: { organizationId: orgId } } },
        include: {
          section: {
            select: {
              id: true,
              name: true,
              room: true,
              course: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.attendanceSession.findMany({
        where: {
          section: { course: { organizationId: orgId } },
          isAdhoc: false,
          date: { gte: fourteenDaysAgo, lte: now },
        },
        select: { scheduleId: true, date: true },
      }),
      this.prisma.assessment.findMany({
        where: {
          organizationId: orgId,
          dueDate: { gte: now, lte: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7) },
        },
        include: { section: { select: { id: true, name: true } } },
        orderBy: { dueDate: 'asc' },
        take: 6,
      }),
      this.prisma.teacher.findMany({
        where: { organizationId: orgId, status: { not: TeacherStatus.DELETED } },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      this.prisma.student.findMany({
        where: { organizationId: orgId, status: { not: StudentStatus.DELETED } },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      this.prisma.assessment.findMany({
        where: { organizationId: orgId },
        include: { section: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 4,
      }),
      this.prisma.attendanceSession.findMany({
        where: { section: { course: { organizationId: orgId } } },
        include: { section: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 4,
      }),
      this.prisma.mail.count({
        where: {
          organizationId: orgId,
          status: {
            in: [MailStatus.OPEN, MailStatus.IN_PROGRESS, MailStatus.AWAITING_RESPONSE],
          },
        },
      }),
    ]);

    const attendanceCoverage = this.getAttendanceCoverage(
      schedules.map((schedule) => ({ id: schedule.id, day: schedule.day })),
      attendanceSessions,
      fourteenDaysAgo,
      now,
    );
    const sectionsWithoutTeachers = sections.filter((section) => section.teachers.length === 0);
    const sectionIdsWithSchedules = new Set(schedules.map((schedule) => schedule.section.id));
    const sectionsWithoutSchedules = sections.filter(
      (section) => !sectionIdsWithSchedules.has(section.id),
    );
    const topSections = [...sections]
      .sort((a, b) => b._count.enrollments - a._count.enrollments)
      .slice(0, 5);
    const nextClass = this.getUpcomingScheduleOccurrences(schedules, 1)[0];

    const recentActivity = this.sortActivities([
      ...recentTeachers.map((teacher) => ({
        id: `teacher:${teacher.id}`,
        title: 'Teacher added',
        description: teacher.user.name || 'New teacher profile created',
        createdAt: teacher.createdAt.toISOString(),
        href: '/teachers',
        tone: 'info' as const,
      })),
      ...recentStudents.map((student) => ({
        id: `student:${student.id}`,
        title: 'Student enrolled',
        description: student.user.name || student.registrationNumber,
        createdAt: student.createdAt.toISOString(),
        href: '/students',
        tone: 'success' as const,
      })),
      ...recentAssessments.map((assessment) => ({
        id: `assessment:${assessment.id}`,
        title: 'Assessment published',
        description: `${assessment.title} in ${assessment.section.name}`,
        createdAt: assessment.createdAt.toISOString(),
        href: `/sections/${assessment.section.id}/assessments/${assessment.id}`,
        tone: 'warning' as const,
      })),
      ...recentAttendance.map((session) => ({
        id: `attendance:${session.id}`,
        title: session.isAdhoc ? 'Ad-hoc attendance captured' : 'Attendance session captured',
        description: session.section.name,
        createdAt: session.createdAt.toISOString(),
        href: `/attendance/${session.section.id}`,
        tone: session.isAdhoc ? ('warning' as const) : ('default' as const),
      })),
    ]);

    return {
      role: user.role || Role.ORG_ADMIN,
      headline: {
        eyebrow: 'Organization Analytics',
        title: 'Operational overview',
        subtitle:
          'Live staffing, scheduling, attendance coverage, and assessment pressure across the organization.',
      },
      summaryCards: [
        {
          id: 'staff',
          label: 'Active Staff',
          value: `${teachers}`,
          detail: `${sectionsWithoutTeachers.length} sections need a teacher`,
          href: '/teachers',
          tone: sectionsWithoutTeachers.length > 0 ? 'warning' : 'success',
        },
        {
          id: 'students',
          label: 'Active Students',
          value: `${students}`,
          detail: `${sections.length} active sections`,
          href: '/students',
          tone: 'info',
        },
        {
          id: 'courses',
          label: 'Learning Units',
          value: `${courses}`,
          detail: `${sections.length} sections in delivery`,
          href: '/courses',
          tone: 'default',
        },
        {
          id: 'coverage',
          label: 'Attendance Coverage',
          value: this.formatPercent(attendanceCoverage.percent),
          detail: `${attendanceCoverage.actual}/${attendanceCoverage.expected} scheduled slots marked in 14 days`,
          href: '/attendance',
          tone:
            attendanceCoverage.percent >= 85
              ? 'success'
              : attendanceCoverage.percent >= 60
                ? 'warning'
                : 'danger',
        },
        {
          id: 'mail',
          label: 'Open Mail Threads',
          value: `${openMailCount}`,
          detail: 'Operational requests awaiting action',
          href: '/mail',
          tone: openMailCount > 0 ? 'warning' : 'success',
        },
      ],
      spotlight: nextClass
        ? {
            id: 'next-class',
            title: `${nextClass.sectionName} is up next`,
            description: `${nextClass.courseName} • ${nextClass.startTime}-${nextClass.endTime}${nextClass.room ? ` • ${nextClass.room}` : ''}`,
            meta: nextClass.startsAt.toLocaleString(),
            href: `/attendance/${nextClass.sectionId}?scheduleId=${nextClass.scheduleId}&date=${this.toDateOnly(nextClass.startsAt)}`,
            badge: 'Next class',
            tone: 'info',
          }
        : null,
      groups: [
        {
          id: 'attention',
          title: 'Needs attention',
          description: 'Structural gaps and time-bound items that deserve follow-up.',
          items: [
            ...sectionsWithoutTeachers.slice(0, 3).map((section) => ({
              id: `staff-gap:${section.id}`,
              title: `${section.name} has no assigned teacher`,
              description: section.course.name,
              href: `/sections/${section.id}`,
              badge: 'Staffing gap',
              tone: 'warning' as const,
            })),
            ...sectionsWithoutSchedules.slice(0, 3).map((section) => ({
              id: `schedule-gap:${section.id}`,
              title: `${section.name} has no timetable`,
              description: section.course.name,
              href: `/sections/${section.id}`,
              badge: 'Schedule gap',
              tone: 'danger' as const,
            })),
            ...upcomingAssessments.slice(0, 3).map((assessment) => ({
              id: `due:${assessment.id}`,
              title: assessment.title,
              description: `${assessment.section.name} due soon`,
              meta: assessment.dueDate?.toLocaleDateString(),
              href: `/sections/${assessment.section.id}/assessments/${assessment.id}`,
              badge: 'Due in 7 days',
              tone: 'info' as const,
            })),
          ],
        },
        {
          id: 'capacity',
          title: 'Section hotspots',
          description: 'Most populated sections in the organization right now.',
          items: topSections.map((section) => ({
            id: `section:${section.id}`,
            title: section.name,
            description: section.course.name,
            meta: `${section._count.enrollments} students`,
            href: `/sections/${section.id}`,
            badge: section.teachers.length > 0 ? 'Staffed' : 'Unstaffed',
            tone: section.teachers.length > 0 ? 'success' : 'warning',
          })),
        },
      ],
      recentActivity,
    };
  }

  private async buildTeacherInsights(
    orgId: string,
    user: JwtPayload,
  ): Promise<DashboardInsightsResponse> {
    const teacher = await this.prisma.teacher.findFirst({
      where: { userId: user.id, organizationId: orgId },
      include: { user: { select: { name: true } } },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    const now = new Date();
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(now.getDate() - 13);

    const sections = await this.prisma.section.findMany({
      where: { teachers: { some: { id: teacher.id } } },
      include: {
        course: { select: { name: true } },
        schedules: true,
        _count: { select: { enrollments: true } },
      },
    });

    const sectionIds = sections.map((section) => section.id);
    const scheduleIds = sections.flatMap((section) =>
      section.schedules.map((schedule) => schedule.id),
    );

    const [
      upcomingAssessments,
      attendanceSessions,
      submissions,
      recentAssessments,
      recentAttendance,
      officialAttendanceRecords,
      uniqueStudentEnrollments,
    ] = await Promise.all([
      this.prisma.assessment.findMany({
        where: {
          sectionId: { in: sectionIds },
          dueDate: { gte: now, lte: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7) },
        },
        include: {
          section: { select: { id: true, name: true } },
          _count: { select: { submissions: true, grades: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 6,
      }),
      this.prisma.attendanceSession.findMany({
        where: {
          scheduleId: { in: scheduleIds },
          isAdhoc: false,
          date: { gte: fourteenDaysAgo, lte: now },
        },
        select: { scheduleId: true, date: true },
      }),
      this.prisma.submission.findMany({
        where: { assessment: { sectionId: { in: sectionIds } } },
        include: {
          assessment: {
            select: {
              id: true,
              title: true,
              section: { select: { id: true, name: true } },
            },
          },
          student: {
            select: {
              id: true,
              user: { select: { name: true } },
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
        take: 5,
      }),
      this.prisma.assessment.findMany({
        where: { sectionId: { in: sectionIds } },
        include: { section: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 4,
      }),
      this.prisma.attendanceSession.findMany({
        where: { sectionId: { in: sectionIds } },
        include: { section: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 4,
      }),
      this.prisma.attendanceRecord.findMany({
        where: {
          session: {
            sectionId: { in: sectionIds },
            isAdhoc: false,
          },
        },
        orderBy: { session: { date: 'desc' } },
        include: {
          session: { select: { sectionId: true } },
          student: {
            select: {
              id: true,
              user: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.enrollment.findMany({
        where: { sectionId: { in: sectionIds } },
        select: { studentId: true },
        distinct: ['studentId'],
      }),
    ]);

    const schedules = sections.flatMap((section) =>
      section.schedules.map((schedule) => ({
        ...schedule,
        section: {
          id: section.id,
          name: section.name,
          room: section.room,
          course: { name: section.course.name },
        },
      })),
    );

    const uniqueStudents = uniqueStudentEnrollments.length;
    const attendanceCoverage = this.getAttendanceCoverage(
      schedules.map((schedule) => ({ id: schedule.id, day: schedule.day })),
      attendanceSessions,
      fourteenDaysAgo,
      now,
    );
    const nextClass = this.getUpcomingScheduleOccurrences(schedules, 1)[0];
    const missedSessions = this.getMissingScheduledSessions(
      schedules.map((schedule) => ({
        id: schedule.id,
        day: schedule.day,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        section: {
          id: schedule.section.id,
          name: schedule.section.name,
          course: { name: schedule.section.course.name },
        },
      })),
      attendanceSessions,
      7,
      5,
    );

    const attendanceByStudent = new Map<
      string,
      {
        studentName: string;
        sectionIds: Set<string>;
        present: number;
        total: number;
      }
    >();

    officialAttendanceRecords.forEach((record) => {
      const existing = attendanceByStudent.get(record.student.id) || {
        studentName: record.student.user.name || 'Student',
        sectionIds: new Set<string>(),
        present: 0,
        total: 0,
      };

      existing.sectionIds.add(record.session.sectionId);
      existing.total += 1;
      if (record.status === 'PRESENT' || record.status === 'LATE') {
        existing.present += 1;
      }
      attendanceByStudent.set(record.student.id, existing);
    });

    const atRiskStudents = Array.from(attendanceByStudent.entries())
      .map(([studentId, stats]) => ({
        studentId,
        name: stats.studentName,
        percent: stats.total > 0 ? (stats.present / stats.total) * 100 : 100,
        sectionId: Array.from(stats.sectionIds)[0] || null,
      }))
      .filter((student) => student.percent < 75)
      .sort((a, b) => a.percent - b.percent)
      .slice(0, 5);

    const recentActivity = this.sortActivities([
      ...submissions.map((submission) => ({
        id: `submission:${submission.id}`,
        title: 'Submission received',
        description: `${submission.student.user.name || 'Student'} • ${submission.assessment.title}`,
        createdAt: submission.submittedAt.toISOString(),
        href: `/sections/${submission.assessment.section.id}/assessments/${submission.assessment.id}`,
        tone: 'info' as const,
      })),
      ...recentAssessments.map((assessment) => ({
        id: `assessment:${assessment.id}`,
        title: 'Assessment updated',
        description: `${assessment.title} • ${assessment.section.name}`,
        createdAt: assessment.createdAt.toISOString(),
        href: `/sections/${assessment.section.id}/assessments/${assessment.id}`,
        tone: 'warning' as const,
      })),
      ...recentAttendance.map((session) => ({
        id: `attendance:${session.id}`,
        title: session.isAdhoc ? 'Ad-hoc attendance saved' : 'Attendance saved',
        description: session.section.name,
        createdAt: session.createdAt.toISOString(),
        href: `/attendance/${session.section.id}`,
        tone: 'success' as const,
      })),
    ]);

    return {
      role: user.role || Role.TEACHER,
      headline: {
        eyebrow: user.role === Role.ORG_MANAGER ? 'Manager Insights' : 'Teaching Insights',
        title: 'Teaching command center',
        subtitle:
          'See your next class, attendance follow-through, learner risk signals, and upcoming deadlines in one place.',
      },
      summaryCards: [
        {
          id: 'sections',
          label: 'Assigned Sections',
          value: `${sections.length}`,
          detail: `${schedules.length} weekly slots configured`,
          href: '/sections?my=true',
          tone: 'info',
        },
        {
          id: 'students',
          label: 'Students Reached',
          value: `${uniqueStudents}`,
          detail: 'Across all assigned sections',
          href: '/students?my=true',
          tone: 'default',
        },
        {
          id: 'coverage',
          label: 'Attendance Follow-through',
          value: this.formatPercent(attendanceCoverage.percent),
          detail: `${attendanceCoverage.actual}/${attendanceCoverage.expected} scheduled slots marked in 14 days`,
          href: '/attendance',
          tone:
            attendanceCoverage.percent >= 85
              ? 'success'
              : attendanceCoverage.percent >= 60
                ? 'warning'
                : 'danger',
        },
        {
          id: 'deadlines',
          label: 'Due This Week',
          value: `${upcomingAssessments.length}`,
          detail: 'Assessments closing in the next 7 days',
          href: '/sections',
          tone: upcomingAssessments.length > 0 ? 'warning' : 'success',
        },
      ],
      spotlight: nextClass
        ? {
            id: 'next-class',
            title: `${nextClass.sectionName} is your next class`,
            description: `${nextClass.courseName} • ${nextClass.startTime}-${nextClass.endTime}${nextClass.room ? ` • ${nextClass.room}` : ''}`,
            meta: nextClass.startsAt.toLocaleString(),
            href: `/attendance/${nextClass.sectionId}?scheduleId=${nextClass.scheduleId}&date=${this.toDateOnly(nextClass.startsAt)}`,
            badge: 'Next class',
            tone: 'info',
          }
        : null,
      groups: [
        {
          id: 'attendance-gaps',
          title: 'Missing attendance',
          description: 'Scheduled slots from the last 7 days that still need a marked session.',
          items: missedSessions.map((session) => ({
            id: `missing:${session.scheduleId}:${session.date}`,
            title: `${session.sectionName} • ${session.startTime}-${session.endTime}`,
            description: session.courseName,
            meta: session.date,
            href: `/attendance/${session.sectionId}?scheduleId=${session.scheduleId}&date=${session.date}`,
            badge: 'Mark now',
            tone: 'warning',
          })),
        },
        {
          id: 'learner-risk',
          title: 'Learner risk signals',
          description: 'Students trending below 75% official attendance in your sections.',
          items: atRiskStudents.map((student) => ({
            id: `risk:${student.studentId}`,
            title: student.name,
            description: 'Official attendance trend',
            meta: this.formatPercent(student.percent),
            href: student.sectionId ? `/attendance/${student.sectionId}` : '/students?my=true',
            badge: 'At risk',
            tone: 'danger',
          })),
        },
        {
          id: 'upcoming',
          title: 'Upcoming deadlines',
          description: 'Work that will hit students soon and may need reminders or grading prep.',
          items: upcomingAssessments.map((assessment) => ({
            id: `assessment:${assessment.id}`,
            title: assessment.title,
            description: assessment.section.name,
            meta: assessment.dueDate?.toLocaleDateString(),
            href: `/sections/${assessment.section.id}/assessments/${assessment.id}`,
            badge: `${assessment._count.submissions} submissions`,
            tone: 'info',
          })),
        },
      ],
      recentActivity,
    };
  }

  private async buildStudentInsights(
    orgId: string,
    user: JwtPayload,
  ): Promise<DashboardInsightsResponse> {
    const student = await this.prisma.student.findUnique({
      where: { userId: user.id },
      include: { user: { select: { name: true } } },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    // Convert student name to slug format
    const studentNameSlug = student.user.name
      ? student.user.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
      : 'me';

    const [enrollments, grades, attendanceRecords, pendingAssessments, submissions] =
      await Promise.all([
        this.prisma.enrollment.findMany({
          where: {
            studentId: student.id,
            section: { course: { organizationId: orgId } },
          },
          include: {
            section: {
              include: {
                course: { select: { name: true } },
                schedules: true,
              },
            },
          },
        }),
        this.calculateFinalGrade(student.id),
        this.prisma.attendanceRecord.findMany({
          where: {
            studentId: student.id,
            session: {
              section: { course: { organizationId: orgId } },
              isAdhoc: false,
            },
          },
          orderBy: { session: { date: 'desc' } },
          include: {
            session: {
              include: {
                section: {
                  select: {
                    id: true,
                    name: true,
                    course: { select: { name: true } },
                  },
                },
              },
            },
          },
        }),
        this.prisma.assessment.findMany({
          where: {
            section: {
              enrollments: { some: { studentId: student.id } },
              course: { organizationId: orgId },
            },
            submissions: { none: { studentId: student.id } },
          },
          include: { section: { select: { id: true, name: true } } },
          orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
          take: 8,
        }),
        this.prisma.submission.findMany({
          where: { studentId: student.id },
          include: {
            assessment: {
              include: { section: { select: { id: true, name: true } } },
            },
          },
          orderBy: { submittedAt: 'desc' },
          take: 5,
        }),
      ]);

    const officialPresent = attendanceRecords.filter(
      (record) => record.status === 'PRESENT' || record.status === 'LATE',
    ).length;
    const overallAttendancePercent =
      attendanceRecords.length > 0
        ? (officialPresent / attendanceRecords.length) * 100
        : 100;
    const averageGrade =
      grades.length > 0
        ? grades.reduce((sum, grade) => sum + grade.finalPercentage, 0) / grades.length
        : 0;

    const attendanceBySection = new Map<
      string,
      {
        sectionName: string;
        courseName: string;
        present: number;
        total: number;
      }
    >();

    attendanceRecords.forEach((record) => {
      const existing = attendanceBySection.get(record.session.section.id) || {
        sectionName: record.session.section.name,
        courseName: record.session.section.course.name,
        present: 0,
        total: 0,
      };
      existing.total += 1;
      if (record.status === 'PRESENT' || record.status === 'LATE') {
        existing.present += 1;
      }
      attendanceBySection.set(record.session.section.id, existing);
    });

    const lowAttendanceSections = Array.from(attendanceBySection.entries())
      .map(([sectionId, stats]) => ({
        sectionId,
        ...stats,
        percent: stats.total > 0 ? (stats.present / stats.total) * 100 : 100,
      }))
      .filter((section) => section.percent < 75)
      .sort((a, b) => a.percent - b.percent)
      .slice(0, 5);

    const lowGradeSections = grades
      .filter((grade) => grade.finalPercentage < 60)
      .sort((a, b) => a.finalPercentage - b.finalPercentage)
      .slice(0, 5);

    const upcomingClasses = this.getUpcomingScheduleOccurrences(
      enrollments.flatMap((enrollment) =>
        enrollment.section.schedules.map((schedule) => ({
          ...schedule,
          section: {
            id: enrollment.section.id,
            name: enrollment.section.name,
            room: enrollment.section.room,
            course: { name: enrollment.section.course.name },
          },
        })),
      ),
      5,
    );

    const nextClass = upcomingClasses[0];
    const nextDeadline = pendingAssessments.find((assessment) => assessment.dueDate);

    const spotlight = (() => {
      if (
        nextDeadline?.dueDate &&
        (!nextClass || nextDeadline.dueDate.getTime() <= nextClass.startsAt.getTime())
      ) {
        return {
          id: `deadline:${nextDeadline.id}`,
          title: `${nextDeadline.title} needs attention`,
          description: `${nextDeadline.section.name} • ${nextDeadline.type}`,
          meta: `Due ${nextDeadline.dueDate.toLocaleString()}`,
          href: `/students/${studentNameSlug}?tab=assessments&assessmentId=${nextDeadline.id}`,
          badge: 'Nearest deadline',
          tone: 'warning' as const,
        };
      }

      if (nextClass) {
        return {
          id: 'next-class',
          title: `${nextClass.sectionName} is your next class`,
          description: `${nextClass.courseName} • ${nextClass.startTime}-${nextClass.endTime}${nextClass.room ? ` • ${nextClass.room}` : ''}`,
          meta: nextClass.startsAt.toLocaleString(),
          href: '/timetable',
          badge: 'Next class',
          tone: 'info' as const,
        };
      }

      return null;
    })();

    const recentActivity = this.sortActivities([
      ...submissions.map((submission) => ({
        id: `submission:${submission.id}`,
        title: 'Submission recorded',
        description: `${submission.assessment.title} • ${submission.assessment.section.name}`,
        createdAt: submission.submittedAt.toISOString(),
        href: `/students/${studentNameSlug}?tab=assessments&assessmentId=${submission.assessment.id}`,
        tone: 'success' as const,
      })),
      ...attendanceRecords.slice(0, 4).map((record) => ({
        id: `attendance:${record.id}`,
        title: 'Attendance updated',
        description: `${record.session.section.name} • ${record.status}`,
        createdAt: record.session.date.toISOString(),
        href: `/students/${studentNameSlug}?tab=attendance`,
        tone:
          record.status === 'ABSENT'
            ? ('danger' as const)
            : record.status === 'LATE'
              ? ('warning' as const)
              : ('success' as const),
      })),
    ]);

    return {
      role: user.role || Role.STUDENT,
      headline: {
        eyebrow: 'Student Insights',
        title: 'Academic overview',
        subtitle:
          'Track attendance, final standing, upcoming coursework, and the classes that need the most attention.',
      },
      summaryCards: [
        {
          id: 'sections',
          label: 'Enrolled Sections',
          value: `${enrollments.length}`,
          detail: `${upcomingClasses.length} upcoming classes in view`,
          href: `/students/${studentNameSlug}?tab=courses`,
          tone: 'info',
        },
        {
          id: 'grade',
          label: 'Average Final Grade',
          value: grades.length > 0 ? this.formatPercent(averageGrade, 1) : 'No grade',
          detail: `${grades.length} graded sections`,
          href: `/students/${studentNameSlug}?tab=grades`,
          tone:
            averageGrade >= 80
              ? 'success'
              : averageGrade >= 60
                ? 'warning'
                : 'danger',
        },
        {
          id: 'attendance',
          label: 'Official Attendance',
          value: this.formatPercent(overallAttendancePercent),
          detail: `${attendanceRecords.length} official attendance marks`,
          href: `/students/${studentNameSlug}?tab=attendance`,
          tone:
            overallAttendancePercent >= 85
              ? 'success'
              : overallAttendancePercent >= 75
                ? 'warning'
                : 'danger',
        },
        {
          id: 'pending',
          label: 'Pending Assessments',
          value: `${pendingAssessments.length}`,
          detail: 'Awaiting your submission',
          href: `/students/${studentNameSlug}?tab=assessments`,
          tone: pendingAssessments.length > 0 ? 'warning' : 'success',
        },
      ],
      spotlight,
      groups: [
        {
          id: 'attention',
          title: 'Needs attention',
          description: 'Low-attendance or low-grade sections that may affect standing.',
          items: [
            ...lowAttendanceSections.map((section) => ({
              id: `attendance-risk:${section.sectionId}`,
              title: `${section.sectionName} attendance is low`,
              description: section.courseName,
              meta: this.formatPercent(section.percent),
              href: `/students/${studentNameSlug}?tab=attendance`,
              badge: 'Attendance risk',
              tone: 'danger' as const,
            })),
            ...lowGradeSections.map((grade) => ({
              id: `grade-risk:${grade.sectionId}`,
              title: `${grade.sectionName} grade is below target`,
              description: grade.courseName,
              meta: this.formatPercent(grade.finalPercentage, 1),
              href: `/students/${studentNameSlug}?tab=grades`,
              badge: 'Grade risk',
              tone: 'warning' as const,
            })),
          ].slice(0, 6),
        },
        {
          id: 'upcoming',
          title: 'Coming up',
          description: 'Deadlines and classes that will shape your next few days.',
          items: [
            ...pendingAssessments.slice(0, 4).map((assessment) => ({
              id: `pending:${assessment.id}`,
              title: assessment.title,
              description: `${assessment.section.name} • ${assessment.type}`,
              meta: assessment.dueDate
                ? `Due ${assessment.dueDate.toLocaleDateString()}`
                : 'No due date',
              href: `/students/${studentNameSlug}?tab=assessments&assessmentId=${assessment.id}`,
              badge: 'Pending',
              tone: 'warning' as const,
            })),
            ...upcomingClasses.slice(0, 4).map((next) => ({
              id: `class:${next.scheduleId}:${next.startsAt.toISOString()}`,
              title: `${next.sectionName} • ${next.startTime}-${next.endTime}`,
              description: next.courseName,
              meta: next.startsAt.toLocaleString(),
              href: '/timetable',
              badge: 'Class',
              tone: 'info' as const,
            })),
          ].slice(0, 8),
        },
      ],
      recentActivity,
    };
  }

  async getInsights(
    orgId: string,
    user: JwtPayload,
  ): Promise<DashboardInsightsResponse> {
    if (user.role === Role.ORG_ADMIN) {
      return this.buildOrgAdminInsights(orgId, user);
    }

    if (user.role === Role.TEACHER || user.role === Role.ORG_MANAGER) {
      return this.buildTeacherInsights(orgId, user);
    }

    if (user.role === Role.STUDENT) {
      return this.buildStudentInsights(orgId, user);
    }

    throw new ForbiddenException('Insights are not available for this role.');
  }

  async getStudentFinalGrades(orgId: string, userId: string) {
    const student = await this.getStudentByUserId(userId);
    if (!student) return [];

    const results = await this.calculateFinalGrade(student.id);
    return results;
  }

  // --- Timetable & Attendance ---
  async createSchedule(orgId: string, sectionId: string, dto: CreateScheduleDto) {
    await this.validateScheduleConflict(sectionId, dto);
    
    return this.prisma.sectionSchedule.create({
      data: {
        sectionId,
        day: dto.day,
        startTime: dto.startTime,
        endTime: dto.endTime,
        room: dto.room,
      },
    });
  }

  async updateSchedule(orgId: string, scheduleId: string, dto: UpdateScheduleDto) {
    const existing = await this.prisma.sectionSchedule.findUnique({
      where: { id: scheduleId },
      include: { section: { include: { course: true } } },
    });

    if (!existing || existing.section.course.organizationId !== orgId) {
      throw new NotFoundException('Schedule not found');
    }

    // Prepare full data for validation
    const validationDto: CreateScheduleDto = {
      day: dto.day ?? existing.day,
      startTime: dto.startTime ?? existing.startTime,
      endTime: dto.endTime ?? existing.endTime,
      room: dto.room === undefined ? (existing.room ?? undefined) : (dto.room ?? undefined),
    };

    await this.validateScheduleConflict(existing.sectionId, validationDto, scheduleId);

    return this.prisma.sectionSchedule.update({
      where: { id: scheduleId },
      data: dto,
    });
  }

  async deleteSchedule(orgId: string, scheduleId: string) {
    const existing = await this.prisma.sectionSchedule.findUnique({
      where: { id: scheduleId },
      include: { section: { include: { course: true } } },
    });

    if (!existing || existing.section.course.organizationId !== orgId) {
      throw new NotFoundException('Schedule not found');
    }

    return this.prisma.sectionSchedule.delete({ where: { id: scheduleId } });
  }

  private async validateScheduleConflict(sectionId: string, dto: CreateScheduleDto, excludeId?: string) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      include: { 
        teachers: { select: { id: true } },
        enrollments: { select: { studentId: true } }
      },
    });

    if (!section) throw new NotFoundException('Section not found');

    const teacherIds = section.teachers.map(t => t.id);
    const studentIds = section.enrollments.map(e => e.studentId);
    const targetRoom = dto.room || section.room;

    // Check for overlaps using the rule: aStart < bEnd && bStart < aEnd
    const conflicts = await this.prisma.sectionSchedule.findMany({
      where: {
        day: dto.day,
        startTime: { lt: dto.endTime },
        endTime: { gt: dto.startTime },
        id: excludeId ? { not: excludeId } : undefined,
      },
      include: {
        section: {
          include: {
            teachers: { select: { id: true, user: { select: { name: true } } } },
            enrollments: { select: { studentId: true } }
          }
        }
      }
    });

    for (const conflict of conflicts) {
      // 1. Same Section Conflict
      if (conflict.sectionId === sectionId) {
          throw new ConflictException('Section already has a class at this time');
      }

      // 2. Room Conflict
      const conflictRoom = conflict.room || conflict.section.room;
      if (targetRoom && conflictRoom === targetRoom) {
          throw new ConflictException(`Room "${targetRoom}" is already occupied at this time`);
      }

      // 3. Teacher Conflict
      const conflictTeacher = conflict.section.teachers.find(t => teacherIds.includes(t.id));
      if (conflictTeacher) {
          throw new ConflictException(`Teacher "${conflictTeacher.user.name}" is already assigned to another section at this time`);
      }

      // 4. Student Conflict
      const hasStudentConflict = conflict.section.enrollments.some(e => studentIds.includes(e.studentId));
      if (hasStudentConflict) {
          throw new ConflictException('One or more students have conflicting schedules in another section');
      }
    }
  }

  async getSchedules(orgId: string, sectionId: string) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      include: { course: true },
    });
    if (!section || section.course.organizationId !== orgId) {
      throw new NotFoundException('Section not found');
    }
    return this.prisma.sectionSchedule.findMany({
      where: { sectionId },
      orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
    });
  }

  private extractTimetableEntries(
    sections: {
      id: string;
      name: string;
      room: string | null;
      course: { name: string };
      schedules: { id: string; day: number; startTime: string; endTime: string; room: string | null }[];
    }[]
  ) {
    const timetable: {
      scheduleId: string;
      sectionId: string;
      sectionName: string;
      courseName: string;
      day: number;
      startTime: string;
      endTime: string;
      room: string | null;
    }[] = [];

    for (const section of sections) {
      for (const schedule of section.schedules) {
        timetable.push({
          scheduleId: schedule.id,
          sectionId: section.id,
          sectionName: section.name,
          courseName: section.course.name,
          day: schedule.day,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          room: schedule.room || section.room,
        });
      }
    }
    return timetable;
  }

  async getStudentTimetable(orgId: string, userId: string) {
    const student = await this.getStudentByUserId(userId);
    if (!student) return [];
    
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId: student.id, section: { course: { organizationId: orgId } } },
      include: {
        section: {
          include: {
            course: { select: { name: true } },
            schedules: { select: { id: true, day: true, startTime: true, endTime: true, room: true } },
          },
        },
      },
    });

    return this.extractTimetableEntries(enrollments.map((e) => e.section));
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

    return this.extractTimetableEntries(sections);
  }

  async createAttendanceSession(
    orgId: string, 
    sectionId: string, 
    user: JwtPayload,
    date: string, 
    scheduleId?: string,
    startTime?: string,
    endTime?: string
  ) {
    await this.assertAttendanceSectionAccess(orgId, sectionId, user);
    await this.validateAttendanceSchedule(sectionId, scheduleId);
    
    const sessionDate = new Date(date);
    if (isNaN(sessionDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }
    
    const isAdhoc = !scheduleId;

    const existing = await this.prisma.attendanceSession.findFirst({
      where: { 
        sectionId,
        date: sessionDate,
        ...(scheduleId ? { scheduleId } : { isAdhoc: true })
      },
    });

    if (existing) {
      throw new ConflictException(
        isAdhoc 
          ? 'An ad-hoc attendance session already exists for this date' 
          : 'Attendance session already exists for this schedule and date'
      );
    }

    return this.prisma.attendanceSession.create({
      data: {
        sectionId,
        scheduleId,
        isAdhoc,
        date: sessionDate,
        startTime,
        endTime,
      },
    });
  }

  async markAttendance(
    orgId: string,
    sessionId: string,
    user: JwtPayload,
    records: AttendanceRecordDto[],
  ) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: { section: { include: { course: true } } },
    });
    if (!session || session.section.course.organizationId !== orgId) {
      throw new NotFoundException('Session not found');
    }

    await this.assertAttendanceSectionAccess(orgId, session.sectionId, user);
    await this.assertStudentsBelongToSection(
      session.sectionId,
      [...new Set(records.map((record) => record.studentId))],
    );

    return this.prisma.$transaction(async (tx) => {
      for (const record of records) {
        await tx.attendanceRecord.upsert({
          where: {
            sessionId_studentId: {
              sessionId,
              studentId: record.studentId,
            },
          },
          create: {
            sessionId,
            studentId: record.studentId,
            status: record.status,
          },
          update: {
            status: record.status,
          },
        });
      }
      return tx.attendanceRecord.findMany({ where: { sessionId } });
    });
  }

  async getSectionAttendanceRange(
    orgId: string,
    sectionId: string,
    user: JwtPayload,
    start: string,
    end: string,
  ) {
    await this.assertAttendanceSectionAccess(orgId, sectionId, user);

    const startDate = new Date(start);
    const endDate = new Date(end);

    const sessions = await this.prisma.attendanceSession.findMany({
      where: { sectionId, date: { gte: startDate, lte: endDate } },
      orderBy: [{ date: 'asc' }, { schedule: { startTime: 'asc' } }],
      include: { 
        records: true,
        schedule: {
          select: {
            startTime: true,
            endTime: true,
            room: true
          }
        }
      },
    });

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        sectionId,
        ...(user.role === Role.STUDENT
          ? { student: { userId: user.id } }
          : {}),
      },
      include: { student: { include: { user: { select: { name: true, email: true } } } } },
    });

    return {
      sessions: sessions.map(s => ({ 
        id: s.id, 
        date: s.date,
        isAdhoc: s.isAdhoc,
        startTime: s.startTime || s.schedule?.startTime,
        endTime: s.endTime || s.schedule?.endTime,
        schedule: s.schedule
          ? {
              startTime: s.schedule.startTime,
              endTime: s.schedule.endTime,
              room: s.schedule.room,
            }
          : null,
      })),
      students: enrollments.map(e => ({
        studentId: e.student.id,
        name: e.student.user.name,
        email: e.student.user.email,
        registrationNumber: e.student.registrationNumber,
        rollNumber: e.student.rollNumber,
        records: sessions.map(s => {
          const record = s.records.find(r => r.studentId === e.student.id);
          return {
            sessionId: s.id,
            date: s.date,
            status: record?.status || null,
          };
        }),
      })),
    };
  }

  async getSectionAttendance(
    orgId: string,
    sectionId: string,
    user: JwtPayload,
    date: string,
    scheduleId?: string,
  ) {
    await this.assertAttendanceSectionAccess(orgId, sectionId, user);
    await this.validateAttendanceSchedule(sectionId, scheduleId);

    const sessionDate = new Date(date);
    const session = await this.prisma.attendanceSession.findFirst({
      where: { 
        sectionId, 
        date: sessionDate,
        scheduleId: scheduleId || null,
        ...(scheduleId ? {} : { isAdhoc: true })
      },
      include: {
        records: true,
        schedule: true,
      },
    });

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        sectionId,
        ...(user.role === Role.STUDENT
          ? { student: { userId: user.id } }
          : {}),
      },
      include: { student: { include: { user: { select: { id: true, name: true, email: true } } } } },
    });

    const recordsMap = new Map();
    if (session) {
      session.records.forEach(r => recordsMap.set(r.studentId, r.status));
    }

    return {
      sessionId: session?.id || null,
      date: sessionDate,
      students: enrollments.map(e => ({
        studentId: e.student.id,
        name: e.student.user.name,
        email: e.student.user.email,
        registrationNumber: e.student.registrationNumber,
        rollNumber: e.student.rollNumber,
        status: recordsMap.get(e.student.id) || null,
      })),
    };
  }

  async getStudentAttendance(
    orgId: string,
    userId: string,
    requester: JwtPayload,
  ) {
    if (requester.role === Role.STUDENT && requester.id !== userId) {
      throw new ForbiddenException(
        'Students can only view their own attendance.',
      );
    }

    const student = await this.getStudentByUserId(userId);
    if (!student) return [];

    if (requester.role === Role.TEACHER) {
      const canAccess = await this.prisma.enrollment.findFirst({
        where: {
          studentId: student.id,
          section: {
            course: { organizationId: orgId },
            teachers: { some: { userId: requester.id } },
          },
        },
        select: { id: true },
      });

      if (!canAccess) {
        throw new ForbiddenException(
          'You are not assigned to this student section.',
        );
      }
    }
    
    return this.prisma.attendanceRecord.findMany({
      where: { studentId: student.id, session: { section: { course: { organizationId: orgId } } } },
      include: {
        session: {
          include: {
            section: { select: { id: true, name: true, course: { select: { name: true } } } },
          },
        },
      },
      orderBy: { session: { date: 'desc' } },
    });
  }
}
