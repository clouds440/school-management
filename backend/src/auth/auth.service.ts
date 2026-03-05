import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService) { }

    async register(registerDto: RegisterDto) {
        const existing = await prisma.organization.findUnique({
            where: { email: registerDto.email },
        });
        if (existing) {
            throw new UnauthorizedException('Email already in use');
        }

        const hashedPassword = await bcrypt.hash(registerDto.password, 10);

        const org = await prisma.organization.create({
            data: {
                name: registerDto.name,
                location: registerDto.location,
                type: registerDto.type,
                email: registerDto.email,
                password: hashedPassword,
            },
        });

        return {
            id: org.id,
            name: org.name,
            email: org.email,
        };
    }

    async login(loginDto: LoginDto) {
        const org = await prisma.organization.findUnique({
            where: { email: loginDto.email },
        });

        if (!org) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(loginDto.password, org.password);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { sub: org.id, email: org.email, type: org.type, approved: org.approved };
        return {
            access_token: await this.jwtService.signAsync(payload),
        };
    }
}
