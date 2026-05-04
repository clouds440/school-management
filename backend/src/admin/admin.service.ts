import {
  UnauthorizedException,
  NotFoundException,
  Injectable,
} from '@nestjs/common';
import { Prisma, User as UserEntity, Organization } from '@prisma/client';
import { OrgStatus, Role, MailCategory } from '../common/enums';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../users/user.service';
import { OrgService } from '../org/org.service';
import {
  getPaginationOptions,
  formatPaginatedResponse,
  mapStatusCounts,
  PaginationOptions,
} from '../common/utils';
import { MailService } from '../mail/mail.service';
import { MailUser } from '../mail/interfaces/mail-user.interface';

import { CreatePlatformAdminDto } from './dto/create-platform-admin.dto';
import { UpdatePlatformAdminDto } from './dto/update-platform-admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly userService: UserService,
    private readonly orgService: OrgService,
  ) {}

  private orgWithAdminInclude = Prisma.validator<Prisma.OrganizationInclude>()({
    users: {
      where: { role: Role.ORG_ADMIN },
      select: { id: true },
      take: 1,
    },
  });

  async getOrganizations(
    options: PaginationOptions & {
      status?: OrgStatus;
      type?: string;
    },
  ) {
    const { skip, take, sortBy, sortOrder } = getPaginationOptions({
      ...options,
      sortBy: options.sortBy || 'createdAt',
      sortOrder: options.sortOrder || 'desc',
    });

    // Map frontend sort keys to Prisma fields
    let prismaSortBy = sortBy;
    if (sortBy === 'email' || sortBy === 'contact') {
      prismaSortBy = 'contactEmail';
    }

    const where: Prisma.OrganizationWhereInput = {
      ...(options.status ? { status: options.status } : {}),
      ...(options.type && options.type !== 'ALL' ? { type: options.type } : {}),
      ...(options.search
        ? {
            OR: [
              { name: { contains: options.search, mode: 'insensitive' } },
              { location: { contains: options.search, mode: 'insensitive' } },
              { type: { contains: options.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    // For dynamic counts based on SEARCH and TYPE but NOT on status
    const countWhere: Prisma.OrganizationWhereInput = {
      ...(options.type && options.type !== 'ALL' ? { type: options.type } : {}),
      ...(options.search
        ? {
            OR: [
              { name: { contains: options.search, mode: 'insensitive' } },
              { location: { contains: options.search, mode: 'insensitive' } },
              { type: { contains: options.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [orgs, totalRecords, statusCounts] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        skip,
        take,
        orderBy: {
          [prismaSortBy]: sortOrder,
        } as Prisma.OrganizationOrderByWithRelationInput,
        include: {
          users: {
            where: { role: Role.ORG_ADMIN },
            select: { id: true },
            take: 1,
          },
        },
      }) as unknown as Promise<(Organization & { users: { id: string }[] })[]>,
      this.prisma.organization.count({ where }),
      this.prisma.organization.groupBy({
        by: ['status'],
        where: countWhere,
        _count: { _all: true },
      }),
    ]);

    const countsMap = mapStatusCounts(statusCounts, OrgStatus);

    const mappedData = orgs.map((org) => ({
      id: org.id,
      name: org.name,
      logoUrl: org.logoUrl,
      location: org.location,
      type: org.type,
      status: org.status,
      statusHistory: org.statusHistory,
      createdAt: org.createdAt,
      phone: org.phone,
      email: org.contactEmail,
      adminUserId: (org as Organization & { users: { id: string }[] })
        .users?.[0]?.id,
    }));

    const response = formatPaginatedResponse(
      mappedData,
      totalRecords,
      options.page,
      options.limit,
    );
    return {
      ...response,
      counts: countsMap,
    };
  }

  async approveOrganization(id: string, admin: UserEntity) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const result = await this.orgService.approveOrganization(id, admin);

    // Find the admin user to send the welcome/re-approval mail
    const orgAdmins = await this.userService.getUsersByOrgAndRole(id, Role.ORG_ADMIN);
    const orgAdmin = orgAdmins[0];

    if (orgAdmin) {
      let subject = `Welcome to EduVerse: ${org.name}`;
      let message = `Congratulations! Your organization **${org.name}** has been approved. You now have full access to your dashboard.\n\nWelcome to the EduVerse community!`;

      if (org.status === OrgStatus.REJECTED) {
        subject = `Re-approval of Your Organization: ${org.name}`;
        message = `Great news! Your organization **${org.name}** has been re-approved after your application was revised. You now have full access back to your dashboard.`;
      } else if (org.status === OrgStatus.SUSPENDED) {
        subject = `Account Unsuspended: ${org.name}`;
        message = `Your organization **${org.name}** has been unsuspended. You can now resume your activities on the platform.`;
      }

      // Send NO_REPLY mail
      await this.mailService.createMail(
        {
          subject,
          category: MailCategory.PLATFORM_NOTICE,
          priority: 'NORMAL',
          message,
          noReply: true,
          assigneeIds: [orgAdmin.id],
        },
        {
          id: admin.id,
          role: admin.role,
          name: admin.name || null,
          email: admin.email,
          organizationId: null,
        },
      );
    }

    return result;
  }

  async rejectOrganization(id: string, reason: string, admin: UserEntity) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const result = await this.orgService.rejectOrganization(id, reason, admin);

    // Find any admin user of this organization to be the target of the mail
    const orgAdmins = await this.userService.getUsersByOrgAndRole(id, Role.ORG_ADMIN);
    const orgAdmin = orgAdmins[0];

    // Create a Mail thread (Notice) - No Reply
    await this.mailService.createMail(
      {
        subject: 'Application Status Update: REJECTED',
        category: 'System Notice',
        priority: 'URGENT',
        message: reason,
        noReply: true,
        assigneeIds: orgAdmin ? [orgAdmin.id] : [],
        targetRole: Role.ORG_ADMIN,
      },
      {
        id: admin.id,
        role: admin.role,
        name: admin.name || null,
        email: admin.email,
        organizationId: id,
      },
    );

    return result;
  }

  async suspendOrganization(id: string, reason: string, admin: UserEntity) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const result = await this.orgService.suspendOrganization(id, reason, admin);

    // Find any admin user of this organization to be the target of the mail
    const orgAdmins = await this.userService.getUsersByOrgAndRole(id, Role.ORG_ADMIN);
    const orgAdmin = orgAdmins[0];

    // Create a Mail thread (Notice) - No Reply
    await this.mailService.createMail(
      {
        subject: 'Organization Status Update: SUSPENDED',
        category: 'Security/Admin Notice',
        priority: 'URGENT',
        message: reason,
        noReply: true,
        assigneeIds: orgAdmin ? [orgAdmin.id] : [],
        targetRole: Role.ORG_ADMIN,
      },
      {
        id: admin.id,
        role: admin.role,
        name: admin.name || null,
        email: admin.email,
        organizationId: id,
      },
    );

    return result;
  }

  async getAdminStats(user: MailUser) {
    const [orgStatusCounts, unreadMail, platformAdmins] = await Promise.all([
      this.prisma.organization.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.mailService.getUnreadCount(user),
      this.prisma.user.count({ where: { role: Role.PLATFORM_ADMIN } }),
    ]);

    const orgCounts = mapStatusCounts(orgStatusCounts, OrgStatus);

    return {
      ...orgCounts,
      UNREAD_MAIL: unreadMail.unread,
      TOTAL_MAIL: unreadMail.total,
      PLATFORM_ADMINS: platformAdmins,
    };
  }

  // --- Platform Admins ---
  async getPlatformAdmins(options: PaginationOptions) {
    const { skip, take, search } = getPaginationOptions(options);

    const where: Prisma.UserWhereInput = {
      role: Role.PLATFORM_ADMIN,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [admins, totalRecords] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return formatPaginatedResponse(
      admins,
      totalRecords,
      options.page,
      options.limit,
    );
  }

  async createPlatformAdmin(data: CreatePlatformAdminDto) {
    return this.userService.createUser({
      email: data.email,
      password: data.password,
      role: Role.PLATFORM_ADMIN,
      name: data.name,
      phone: data.phone,
      avatarUrl: '/assets/eduverse-icon.png',
    });
  }

  async updatePlatformAdmin(id: string, data: UpdatePlatformAdminDto) {
    const admin = await this.userService.getUserById(id);
    if (admin.role !== Role.PLATFORM_ADMIN) throw new NotFoundException('Platform admin not found');

    const updateData: Prisma.UserUpdateInput = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.phone) updateData.phone = data.phone;
    if (data.password) updateData.password = data.password;

    return this.userService.updateUser(id, updateData);
  }

  async deletePlatformAdmin(id: string) {
    const admin = await this.userService.getUserById(id);
    if (admin.role !== Role.PLATFORM_ADMIN) throw new NotFoundException('Platform admin not found');

    return this.userService.deleteUser(id);
  }

  async changeAdminPassword(userId: string, oldPass: string, newPass: string) {
    const user = await this.userService.getUserById(userId);
    if (
      user.role !== Role.SUPER_ADMIN &&
      user.role !== Role.PLATFORM_ADMIN
    ) {
      throw new UnauthorizedException('Admin not found');
    }

    const updatedUser = await this.userService.changePassword(userId, oldPass, newPass);
    return this.authService.generateToken(updatedUser);
  }
}
