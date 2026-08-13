import type { NextFunction, Request, Response } from 'express';
import type { GatewayConfig } from '../config/gateway.config';
import {
  JwtVerifier,
  type AccessTokenPayload,
} from './jwt-verifier.service';

/**
 * True for the small set of endpoints that must be reachable WITHOUT an access
 * token (registration, OTP verify, login, refresh, logout — the last two carry a
 * refresh token that identity-service validates itself) plus the JWKS and health.
 */
export function isPublicPath(method: string, path: string): boolean {
  if (path === '/' || path === '/health') {
    return true;
  }

  if (path.startsWith('/api/v1/auth/')) {
    const name = path.slice('/api/v1/auth'.length);
    return (
      name === '/register' ||
      name === '/verify' ||
      name === '/login' ||
      name === '/refresh' ||
      name === '/logout' ||
      name === '/.well-known/jwks.json'
    );
  }

  return false;
}

function extractBearerToken(header: string | undefined): string | null {
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  const token = header.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

function unauthorized(res: Response): void {
  if (!res.headersSent) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid access token.',
      },
    });
  }
}

/**
 * Gateway authentication middleware.
 *
 * For protected routes it verifies the RS256 access token with the public key,
 * then forwards the verified identity claims to the downstream service as
 * headers (dropping any client-supplied identity headers first, so spoofing is
 * impossible). Public routes pass straight through.
 *
 * This middleware performs NO business logic and talks to NO database — it only
 * verifies tokens and forwards claims.
 */
export function createAuthMiddleware(
  config: GatewayConfig,
  verifier: JwtVerifier,
) {
  return async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    if (req.method === 'OPTIONS' || isPublicPath(req.method, req.path)) {
      next();
      return;
    }

    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      unauthorized(res);
      return;
    }

    try {
      const payload = await verifier.verifyAccessToken(token);

      // Trust only the verified token — never client-supplied identity headers.
      delete req.headers['x-user-id'];
      delete req.headers['x-auth-identity-id'];
      delete req.headers['x-locale'];
      delete req.headers['x-email'];

      req.headers['x-user-id'] = payload.sub;
      req.headers['x-auth-identity-id'] = payload.auth_identity_id ?? '';
      if (payload.email) {
        req.headers['x-email'] = payload.email;
      }
      if (payload.locale) {
        req.headers['x-locale'] = payload.locale;
      }
      (req as Request & { user?: AccessTokenPayload }).user = payload;

      next();
    } catch {
      unauthorized(res);
    }
  };
}
