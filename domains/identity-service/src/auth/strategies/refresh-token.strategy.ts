import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWT_CONFIG } from '../jwt.config';
import { JwtKeysService } from '../jwt-keys.service';
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
 * (`{ "refreshToken": "..." }`). Refresh tokens are signed with RS256 by this
 * service's private key and verified here with the public key. They must pass
 * type (`refresh`) + `jti` checks. Refresh tokens are only ever consumed by
 * identity-service (rotation/logout) — never by the gateway or other services.
 */
@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly jwtKeys: JwtKeysService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: jwtKeys.getPublicKeyPem(),
      algorithms: [JWT_CONFIG.algorithm],
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
