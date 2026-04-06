import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './interfaces/jwt-payload.interface';

interface ExtendedJwtPayload extends JwtPayload {
    tokenVersion?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        private configService: ConfigService,
        private prisma: PrismaService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || '',
        } as any);
    }

    async validate(payload: ExtendedJwtPayload) {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            include: { organization: true }
        });
        if (!user) {
            throw new UnauthorizedException();
        }

        // Token Versioning check: only enforce if the payload has a version (resilient to legacy tokens)
        if (payload.tokenVersion !== undefined && user.tokenVersion !== payload.tokenVersion) {
            throw new UnauthorizedException('Session expired or revoked. Please log in again.');
        }

        return user;
    }
}
