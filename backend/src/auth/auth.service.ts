import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient, User, Organization, Teacher } from '@prisma/client';

export type TokenUser = User & {
    organization?: Organization | null;
    teacherProfile?: Teacher | null;
};

const prisma = new PrismaClient();

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService) { }

    async register(registerDto: RegisterDto) {
        const existing = await prisma.user.findUnique({
            where: { email: registerDto.email },
        });
        if (existing) {
            throw new UnauthorizedException('Email already in use');
        }

        const hashedPassword = await bcrypt.hash(registerDto.password, 10);

        // Transaction to ensure both Org and User are created
        const result = await prisma.$transaction(async (tx) => {
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
                    role: 'ORG_ADMIN',
                    organizationId: org.id,
                    name: registerDto.name, // Set name to Org name for ORG_ADMIN
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
        const user = await prisma.user.findUnique({
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
            orgId: user.organizationId,
            status: user.organization ? user.organization.status : 'APPROVED', // Keep SUPER_ADMIN as APPROVED
            isFirstLogin: user.isFirstLogin
        };


        return {
            access_token: await this.jwtService.signAsync(payload, {
                expiresIn: rememberMe ? '30d' : '1d'
            }),
            role: user.role
        };
    }


    async changePassword(userId: string, oldPass: string, newPass: string) {
        const user = await prisma.user.findUnique({ where: { id: userId }, include: { organization: true } });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const isMatch = await bcrypt.compare(oldPass, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Incorrect old password');
        }

        const hashedNew = await bcrypt.hash(newPass, 10);
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedNew,
                isFirstLogin: false
            },
            include: { organization: true, teacherProfile: true }
        });

        return this.generateToken(updatedUser);
    }
}
