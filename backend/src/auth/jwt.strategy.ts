import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './interfaces/jwt-payload.interface';

interface ExtendedJwtPayload extends JwtPayload {
    tokenVersion?: number;
}

const prisma = new PrismaClient();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || '',
        } as any);
    }

    async validate(payload: ExtendedJwtPayload) {
        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
            include: { organization: true }
        });
        if (!user) {
            throw new UnauthorizedException();
        }

        // Token Versioning check
        if (user.tokenVersion !== payload.tokenVersion) {
            throw new UnauthorizedException('Session expired or revoked. Please log in again.');
        }

        return user;
    }
}
