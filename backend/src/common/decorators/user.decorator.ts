import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from '../../auth/interfaces/authenticated-request.interface';

/**
 * Parameter decorator to extract the full user object from the authenticated request.
 */
export const User = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
        return request.user;
    },
);
