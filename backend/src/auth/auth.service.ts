import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User, Organization, Teacher, ThemeMode } from '@prisma/client';
import { Role, OrgStatus } from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';
import { BCRYPT_ROUNDS } from '../common/utils';

export type TokenUser = User & {
  organization?: Organization | null;
  teacherProfile?: Teacher | null;
  avatarUrl?: string | null;
  avatarUpdatedAt?: Date | null;
  themeMode?: ThemeMode | null;
};

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });
    if (existing) {
      throw new UnauthorizedException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(
      registerDto.password,
      BCRYPT_ROUNDS,
    );

    // Transaction to ensure both Org and User are created
    const result = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: registerDto.name,
          location: registerDto.location,
          type: registerDto.type,
          contactEmail: registerDto.contactEmail,
          phone: registerDto.phone,
        },
      });

      const user = await tx.user.create({
        data: {
          email: registerDto.email,
          password: hashedPassword,
          role: Role.ORG_ADMIN,
          organizationId: org.id,
          name: registerDto.adminName, // Set name to Admin Name for ORG_ADMIN
        },
      });

      return { org, user };
    });

    return {
      id: result.user.id,
      email: result.user.email,
      orgName: result.org.name,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: { organization: true, teacherProfile: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const rememberMe = loginDto.rememberMe === true;
    return this.generateToken(user, rememberMe, loginDto);
  }

  async generateToken(user: TokenUser, rememberMe: boolean = false, loginDto?: LoginDto) {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name, // Include name in JWT payload
      role: user.role,
      designation: user.teacherProfile?.designation || null, // Added for teacher personalization
      orgName: user.organization?.name || null,
      orgId: user.organizationId,
      orgLogoUrl: user.organization?.logoUrl || null,
      avatarUrl: user.avatarUrl || null,
      avatarUpdatedAt: user.avatarUpdatedAt || null,
      themeMode: user.themeMode ?? ThemeMode.SYSTEM,
      status: user.organization ? user.organization.status : OrgStatus.APPROVED, // Keep SUPER_ADMIN as APPROVED
      isFirstLogin: user.isFirstLogin,
    };

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: rememberMe ? '30d' : '1d',
    });

    // Create session if deviceId is provided
    if (loginDto?.deviceId) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 1));

      // Check if this device already has an active session
      const existingSession = await this.prisma.session.findFirst({
        where: {
          userId: user.id,
          deviceId: loginDto.deviceId,
          isActive: true,
        },
      });

      if (existingSession) {
        // Update existing session
        await this.prisma.session.update({
          where: { id: existingSession.id },
          data: {
            token,
            lastSeenAt: new Date(),
            expiresAt,
            deviceName: loginDto.deviceName,
            deviceType: loginDto.deviceType,
            browser: loginDto.browser,
            os: loginDto.os,
          },
        });
      } else {
        // Check if this is a new device (first time seeing this deviceId)
        const deviceSessions = await this.prisma.session.findMany({
          where: { userId: user.id },
          select: { deviceId: true },
        });
        const isNewDevice = !deviceSessions.some(s => s.deviceId === loginDto.deviceId);

        // Create new session
        await this.prisma.session.create({
          data: {
            userId: user.id,
            deviceId: loginDto.deviceId,
            deviceName: loginDto.deviceName,
            deviceType: loginDto.deviceType,
            browser: loginDto.browser,
            os: loginDto.os,
            token,
            expiresAt,
          },
        });

        // Send notification if this is a new device
        if (isNewDevice) {
          await this.prisma.notification.create({
            data: {
              userId: user.id,
              title: 'New Device Login',
              body: `A new device (${loginDto.deviceName || 'Unknown Device'}) has logged into your account. If this wasn't you, please revoke this session in your settings.`,
              type: 'SECURITY',
              actionUrl: '/settings',
              metadata: {
                deviceId: loginDto.deviceId,
                deviceName: loginDto.deviceName,
                loginTime: new Date().toISOString(),
              },
            },
          });
        }
      }
    }

    return {
      access_token: token,
      role: user.role,
    };
  }

  async updateProfile(
    userId: string,
    data: Partial<{ themeMode: 'LIGHT' | 'DARK' | 'SYSTEM'; name?: string }>,
  ) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        themeMode: data.themeMode,
        name: data.name,
      },
      include: { organization: true, teacherProfile: true },
    });

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      organization: updated.organization,
      teacherProfile: updated.teacherProfile,
      themeMode: updated.themeMode,
    };
  }

  async changePassword(userId: string, oldPass: string, newPass: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isMatch = await bcrypt.compare(oldPass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Incorrect old password');
    }

    const hashedNew = await bcrypt.hash(newPass, BCRYPT_ROUNDS);
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNew,
        isFirstLogin: false,
      },
      include: { organization: true, teacherProfile: true },
    });

    // Revoke all sessions when password changes
    await this.prisma.session.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    return this.generateToken(updatedUser);
  }

  async logout(userId: string) {
    // Revoke all sessions for this user
    await this.prisma.session.updateMany({
      where: { userId },
      data: { isActive: false },
    });
    return { message: 'Logged out successfully' };
  }

  async getSessions(userId: string) {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sessions;
  }

  async revokeSession(userId: string, sessionId: string, currentToken?: string) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    // Check if trying to revoke current session
    if (currentToken && session.token === currentToken) {
      // Instead of revoking, return instruction to logout
      return { message: 'Cannot revoke current session. Please log out instead.', shouldLogout: true };
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false },
    });

    return { message: 'Session revoked successfully' };
  }

  async revokeAllSessions(userId: string, excludeToken?: string) {
    await this.prisma.session.updateMany({
      where: {
        userId,
        isActive: true,
        ...(excludeToken && { token: { not: excludeToken } }),
      },
      data: { isActive: false },
    });

    return { message: 'All sessions revoked successfully' };
  }
}
