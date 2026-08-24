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

/**
 * Extracts the `x-account-id` header forwarded by the api-gateway.
 *
 * The access token does NOT carry `account_id` (accounts are owned by
 * accounts-service, so identity-service never signs that claim — see
 * identity-service jwt.config.ts). The gateway composites the account context
 * and forwards it as `x-account-id`; this decorator reads that trusted header.
 */
export const CurrentAccountId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const accountId = req.headers['x-account-id'];
    if (!accountId || typeof accountId !== 'string' || accountId.length === 0) {
      throw new Error(
        'Missing x-account-id header (api-gateway must forward account context)',
      );
    }
    return accountId;
  },
);
