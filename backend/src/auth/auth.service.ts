import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User, Organization, Teacher } from '@prisma/client';
import { Role, OrgStatus } from '../common/enums';
import { PrismaService } from '../prisma/prisma.service';
import { BCRYPT_ROUNDS } from '../common/utils';

export type TokenUser = User & {
    organization?: Organization | null;
    teacherProfile?: Teacher | null;
    avatarUrl?: string | null;
    avatarUpdatedAt?: Date | null;
    tokenVersion?: number;
};

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private prisma: PrismaService
    ) { }

    async register(registerDto: RegisterDto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: registerDto.email },
        });
        if (existing) {
            throw new UnauthorizedException('Email already in use');
        }

        const hashedPassword = await bcrypt.hash(registerDto.password, BCRYPT_ROUNDS);

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
                    tokenVersion: 0,
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
            include: { organization: true, teacherProfile: true }
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(loginDto.password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const rememberMe = loginDto.rememberMe === true;
        return this.generateToken(user, rememberMe);
    }

    async generateToken(user: TokenUser, rememberMe: boolean = false) {
        const slug = user.organization?.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || null;
        const payload = {
            sub: user.id,
            email: user.email,
            name: user.name, // Include name in JWT payload
            role: user.role,
            designation: user.teacherProfile?.designation || null, // Added for teacher personalization
            orgSlug: slug,
            orgName: user.organization?.name || null,
            orgId: user.organizationId,
            orgLogoUrl: user.organization?.logoUrl || null,
            avatarUrl: user.avatarUrl || null,
            avatarUpdatedAt: user.avatarUpdatedAt || null,
            status: user.organization ? user.organization.status : OrgStatus.APPROVED, // Keep SUPER_ADMIN as APPROVED
            isFirstLogin: user.isFirstLogin,
            tokenVersion: user.tokenVersion
        };


        return {
            access_token: await this.jwtService.signAsync(payload, {
                expiresIn: rememberMe ? '30d' : '1d'
            }),
            role: user.role
        };
    }


    async changePassword(userId: string, oldPass: string, newPass: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { organization: true } });
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
                tokenVersion: { increment: 1 } // Invalidate all existing sessions
            },
            include: { organization: true, teacherProfile: true }
        });

        return this.generateToken(updatedUser);
    }

    async logout(userId: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                tokenVersion: { increment: 1 }
            }
        });
        return { message: 'Logged out successfully' };
    }
}
