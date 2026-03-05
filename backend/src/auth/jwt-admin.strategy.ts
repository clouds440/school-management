import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { ConfigService } from '@nestjs/config';

const prisma = new PrismaClient();

@Injectable()
export class JwtAdminStrategy extends PassportStrategy(Strategy, 'jwt-admin') {
    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('SUPER_ADMIN_JWT_SECRET'),
        } as any);
    }

    async validate(payload: any) {
        if (!payload.role || payload.role !== 'admin') {
            throw new UnauthorizedException();
        }
        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
        });
        if (!user || user.role !== 'admin') {
            throw new UnauthorizedException();
        }
        return user;
    }
}
