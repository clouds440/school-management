import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import { AuthenticatedRequest } from '../../auth/interfaces/authenticated-request.interface';

/**
 * Parameter decorator to extract the organizationId from the authenticated request.
 * Automatically throws a BadRequestException if the organizationId is missing.
 */
export const OrgId = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
        const orgId = request.user?.organizationId;

        if (!orgId) {
            throw new BadRequestException('No organization associated with this account');
        }

        return orgId;
    },
);
