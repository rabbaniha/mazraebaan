import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AccessTokenUser } from '../interfaces/jwt-payload.interface';

/**
 * Pulls the validated user off the request (set by Passport's JwtStrategy).
 * Works for both the access ('jwt') and refresh ('jwt-refresh') strategies.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AccessTokenUser | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: AccessTokenUser }>();
    return request.user;
  },
);
