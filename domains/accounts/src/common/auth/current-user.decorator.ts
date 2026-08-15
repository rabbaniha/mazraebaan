import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from './access-token.guard';

/**
 * Extracts the verified user id (`sub` claim) from the request. Only usable
 * behind `AccessTokenGuard`.
 */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!req.userId) {
      throw new Error('Missing authenticated user (AccessTokenGuard required)');
    }
    return req.userId;
  },
);
