import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import jwt from 'jsonwebtoken';
import type { Request } from 'express';
import { JwtPublicKeyService } from './jwt-public-key.service';
import { IS_PUBLIC_KEY } from './public.decorator';

/** Expected access-token claims (same issuer/algorithm as identity-service). */
const ISSUER = 'mazraebaan-identity';
const ALGORITHM = 'RS256';

/** An inbound request augmented with the verified identity claims. */
export interface AuthenticatedRequest extends Request {
  userId?: string;
  authIdentityId?: string;
  email?: string | null;
  locale?: string;
}

/**
 * Shared guard for accounts-service routes: independently verifies the RS256
 * access token with identity-service's PUBLIC key. The service never trusts
 * client-provided identity headers — only the cryptographic token.
 */
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly keys: JwtPublicKeyService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const req = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();

    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      throw new UnauthorizedException('Missing access token.');
    }

    try {
      const key = await this.keys.getPublicKey();
      const payload = jwt.verify(token, key, {
        algorithms: [ALGORITHM],
        issuer: ISSUER,
      }) as { sub?: string; type?: string; onboarding_completed?: boolean; auth_identity_id?: string; email?: string | null; locale?: string };

      if (payload.type !== 'access' || payload.onboarding_completed !== true || typeof payload.sub !== 'string') {
        throw new UnauthorizedException('Invalid token type.');
      }

      req.userId = payload.sub;
      req.authIdentityId = payload.auth_identity_id;
      req.email = payload.email ?? null;
      req.locale = payload.locale;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }
}

function extractBearerToken(header: string | undefined): string | null {
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  const token = header.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}
