import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User, Organization, Teacher, ThemeMode } from '@prisma/client';
import { Role, OrgStatus, UserStatus } from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';
import { BCRYPT_ROUNDS } from '../common/utils';
import { resolveAccessLevel } from '../common/access-control/access.utils';

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
  ) { }

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

  async login(loginDto: LoginDto, ip: string = 'unknown') {
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

    if (user.status === 'DELETED') {
      throw new UnauthorizedException(
        'Your account has been deleted by your organization',
      );
    }

    // Cleanup old inactive sessions for this user (older than 90 days)
    await this.cleanupOldSessions(user.id);

    const rememberMe = loginDto.rememberMe === true;
    return this.generateToken(user, rememberMe, loginDto, ip);
  }

  async generateToken(
    user: TokenUser,
    rememberMe: boolean = false,
    loginDto?: LoginDto,
    ip: string = 'unknown',
  ) {
    const payload = {
      id: user.id,
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
      userStatus: user.status as unknown as UserStatus,
      accessLevel: resolveAccessLevel({
        userStatus: user.status as unknown as UserStatus,
        orgStatus: (user.organization?.status as unknown as OrgStatus) || OrgStatus.APPROVED,
      }),
      isFirstLogin: user.isFirstLogin,
    };

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: rememberMe ? '30d' : '1d',
    });

    // Create session if deviceId is provided
    if (loginDto?.deviceId) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 1));

      // Get location (country only) from IP (simple lookup)
      let location: string | null = null;
      if (ip !== 'unknown') {
        try {
          // Using a free IP geolocation API
          const response = await fetch(`http://ip-api.com/json/${ip}`);
          const data = await response.json();
          if (data.status === 'success') {
            location = data.country;
          }
        } catch (error) {
          // Silently fail location lookup
          console.warn('Failed to lookup location from IP:', error);
        }
      }

      // Check if this device already has an active session
      const existingSession = await this.prisma.session.findFirst({
        where: {
          userId: user.id,
          deviceId: loginDto.deviceId,
          isActive: true,
        },
      });

      if (existingSession) {
        // Check for country change (suspicious activity)
        const countryChanged = existingSession.location && location && existingSession.location !== location;

        // Update existing session (IP binding removed to support mobile users with changing IPs)
        await this.prisma.session.update({
          where: { id: existingSession.id },
          data: {
            token,
            lastSeenAt: new Date(),
            expiresAt,
            deviceName: loginDto.deviceName,
            deviceType: loginDto.deviceType,
            ip,
            location,
          },
        });

        // Send notification if country changed (suspicious activity)
        if (countryChanged) {
          await this.prisma.notification.create({
            data: {
              userId: user.id,
              title: 'Suspicious Activity Detected',
              body: `Your account was accessed from a new location (${location}). Previous location: ${existingSession.location}. If this wasn't you, please revoke this session in your settings.`,
              type: 'SECURITY',
              actionUrl: '/settings#sessions',
              metadata: {
                deviceId: loginDto.deviceId,
                deviceName: loginDto.deviceName,
                previousLocation: existingSession.location,
                newLocation: location,
                loginTime: new Date().toISOString(),
              },
            },
          });
        }
      } else {
        // Check if this is a new device (first time seeing this deviceId)
        const deviceSessions = await this.prisma.session.findMany({
          where: { userId: user.id },
          select: { deviceId: true, ip: true, location: true },
        });
        const isNewDevice = !deviceSessions.some(
          (s) => s.deviceId === loginDto.deviceId,
        );

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
            ip,
            location,
          },
        });

        // Send notification if this is a new device
        if (isNewDevice) {
          await this.prisma.notification.create({
            data: {
              userId: user.id,
              title: 'New Device Login',
              body: `A new device (${loginDto.deviceName || 'Unknown Device'}) has logged into your account from ${location || 'Unknown Location'} (IP: ${ip}). If this wasn't you, please revoke this session in your settings.`,
              type: 'SECURITY',
              actionUrl: '/settings#sessions',
              metadata: {
                deviceId: loginDto.deviceId,
                deviceName: loginDto.deviceName,
                ip,
                location,
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
      status: user.status as unknown as UserStatus,
      accessLevel: resolveAccessLevel({
        userStatus: user.status as unknown as UserStatus,
        orgStatus: (user.organization?.status as unknown as OrgStatus) || OrgStatus.APPROVED,
      }),
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

  async changePassword(userId: string, oldPass: string, newPass: string, currentToken?: string) {
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

    // Issue a NEW token so the isFirstLogin: false change is reflected in the JWT payload
    const { access_token: newToken } = await this.generateToken(updatedUser, true);

    // Update the session in database if it exists
    if (currentToken) {
      await this.prisma.session.updateMany({
        where: {
          userId,
          token: currentToken,
          isActive: true,
        },
        data: {
          token: newToken,
          lastSeenAt: new Date(),
        },
      });

      // Revoke all other sessions
      await this.prisma.session.updateMany({
        where: {
          userId,
          token: { not: newToken },
          isActive: true,
        },
        data: { isActive: false },
      });
    }

    return {
      access_token: newToken,
      role: updatedUser.role,
      status: updatedUser.status as unknown as UserStatus,
      accessLevel: resolveAccessLevel({
        userStatus: updatedUser.status as unknown as UserStatus,
        orgStatus: (updatedUser.organization?.status as unknown as OrgStatus) || OrgStatus.APPROVED,
      }),
    };
  }

  async logout(userId: string, token?: string) {
    if (token) {
      // Revoke only the current session
      const session = await this.prisma.session.findFirst({
        where: {
          userId,
          token,
          isActive: true,
        },
      });

      if (session) {
        await this.prisma.session.update({
          where: { id: session.id },
          data: { isActive: false },
        });
      }
    } else {
      // Fallback: revoke all sessions if no token provided
      await this.prisma.session.updateMany({
        where: { userId },
        data: { isActive: false },
      });
    }
    return { message: 'Logged out successfully' };
  }

  /**
   * Cleanup old inactive sessions for a user
   * Removes inactive sessions older than 90 days
   */
  private async cleanupOldSessions(userId: string) {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    await this.prisma.session.deleteMany({
      where: {
        userId,
        isActive: false,
        expiresAt: { lt: ninetyDaysAgo },
      },
    });
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

  async revokeSession(
    userId: string,
    sessionId: string,
    currentToken?: string,
  ) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    // Check if trying to revoke current session
    if (currentToken && session.token === currentToken) {
      // Instead of revoking, return instruction to logout
      return {
        message: 'Cannot revoke current session. Please log out instead.',
        shouldLogout: true,
      };
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
