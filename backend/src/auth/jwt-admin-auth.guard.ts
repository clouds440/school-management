import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAdminAuthGuard extends AuthGuard('jwt-admin') {
    canActivate(context: ExecutionContext) {
        return super.canActivate(context);
    }

    handleRequest(err: any, user: any, info: any) {
        if (err || !user) {
            throw err || new UnauthorizedException();
        }
        return user;
    }
}
