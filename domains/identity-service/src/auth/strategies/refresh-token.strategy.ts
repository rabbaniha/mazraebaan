import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWT_CONFIG } from '../jwt.config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * A validated refresh-token request context (attached to `req.user`).
 * Adds the raw refresh token so the service can hash it and rotate the row.
 */
export interface RefreshTokenAuthContext extends JwtPayload {
  refreshToken: string;
}

/**
 * Validates the refresh token submitted in the request body
 * (`{ "refreshToken": "..." }`). The refresh token is signed with its own
 * secret (`JWT_REFRESH_SECRET`) and must pass type + jti checks.
 */
@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: JWT_CONFIG.refreshSecret,
      issuer: JWT_CONFIG.issuer,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload): RefreshTokenAuthContext | null {
    if (payload.type !== 'refresh' || !payload.jti) {
      // Only refresh tokens carrying a token id are valid for rotation.
      return null;
    }

    const body = req.body as { refreshToken?: unknown } | undefined;
    const rawToken = body?.refreshToken;
    if (typeof rawToken !== 'string' || rawToken.length === 0) {
      return null;
    }

    return {
      ...payload,
      refreshToken: rawToken,
    };
  }
}
