import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Role, OrgStatus, TeacherStatus, StudentStatus } from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';

import { UpdateSettingsDto } from './dto/update-settings.dto';
import { FilesService } from '../files/files.service';
import { UserService } from '../users/user.service';

@Injectable()
export class OrgService {
  constructor(
    private readonly filesService: FilesService,
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  private async getOrganizationById(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  // --- Settings ---
  async getSettings(orgId: string) {
    const org = await this.getOrganizationById(orgId);

    return {
      id: org.id,
      name: org.name,
      location: org.location,
      type: org.type,
      contactEmail: org.contactEmail,
      phone: org.phone,
      logoUrl: org.logoUrl,
      avatarUpdatedAt: org.avatarUpdatedAt,
      accentColor: org.accentColor,
      status: org.status,
      statusHistory: org.statusHistory,
      createdAt: org.createdAt,
    };
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
    const org = await this.getOrganizationById(orgId);

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
    const user = await this.userService.getUserById(userId);

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
    return this.userService.updateUser(userId, { avatarUrl: publicUrl });
  }




  async reapply(orgId: string) {
    const org = await this.getOrganizationById(orgId);

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

  async approveOrganization(orgId: string, admin: { name: string | null; email: string; role: string; id: string }) {
    const org = await this.getOrganizationById(orgId);

    const history = (org.statusHistory as Prisma.JsonArray) || [];
    const newEntry = {
      status: OrgStatus.APPROVED,
      message: 'Organization approved.',
      adminName: admin.name || admin.email,
      adminRole: admin.role,
      createdAt: new Date(),
    };

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedOrg = await tx.organization.update({
        where: { id: orgId },
        data: {
          status: OrgStatus.APPROVED,
          statusHistory: [...history, newEntry] as Prisma.InputJsonValue,
        },
      });

      // Instant Revocation: Revoke all sessions for organization users
      await tx.session.updateMany({
        where: { user: { organizationId: orgId } },
        data: { isActive: false },
      });

      return updatedOrg;
    });

    return result;
  }

  async rejectOrganization(orgId: string, reason: string, admin: { name: string | null; email: string; role: string; id: string }) {
    const org = await this.getOrganizationById(orgId);

    const history = (org.statusHistory as Prisma.JsonArray) || [];
    const newEntry = {
      status: OrgStatus.REJECTED,
      message: reason,
      adminName: admin.name || admin.email,
      adminRole: admin.role,
      createdAt: new Date(),
    };

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedOrg = await tx.organization.update({
        where: { id: orgId },
        data: {
          status: OrgStatus.REJECTED,
          statusHistory: [...history, newEntry] as Prisma.InputJsonValue,
        },
      });

      // Instant Revocation for all Org users
      await tx.session.updateMany({
        where: { user: { organizationId: orgId } },
        data: { isActive: false },
      });

      return updatedOrg;
    });

    return result;
  }

  async suspendOrganization(orgId: string, reason: string, admin: { name: string | null; email: string; role: string; id: string }) {
    const org = await this.getOrganizationById(orgId);

    const history = (org.statusHistory as Prisma.JsonArray) || [];
    const newEntry = {
      status: OrgStatus.SUSPENDED,
      message: reason,
      adminName: admin.name || admin.email,
      adminRole: admin.role,
      createdAt: new Date(),
    };

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedOrg = await tx.organization.update({
        where: { id: orgId },
        data: {
          status: OrgStatus.SUSPENDED,
          statusHistory: [...history, newEntry] as Prisma.InputJsonValue,
        },
      });

      // Instant Revocation for all Org users
      await tx.session.updateMany({
        where: { user: { organizationId: orgId } },
        data: { isActive: false },
      });

      return updatedOrg;
    });

    return result;
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


}
