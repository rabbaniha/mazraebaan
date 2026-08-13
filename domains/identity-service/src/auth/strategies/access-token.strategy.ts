import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWT_CONFIG } from '../jwt.config';
import {
  AccessTokenUser,
  JwtPayload,
} from '../interfaces/jwt-payload.interface';

/**
 * Validates `Authorization: Bearer <access token>` requests.
 *
 * NOTE: In production, per backend-conventions, downstream services trust the
 * api-gateway's forwarded claims and do NOT re-validate JWTs. This strategy
 * exists because identity-service IS the token issuer and must be able to
 * protect its own endpoints (e.g. GET /auth/me, POST /auth/logout).
 */
@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_CONFIG.accessSecret,
      issuer: JWT_CONFIG.issuer,
    });
  }

  validate(payload: JwtPayload): AccessTokenUser | null {
    if (payload.type !== 'access') {
      // A refresh token must never be accepted as an access token.
      return null;
    }

    return {
      userId: payload.sub,
      authIdentityId: payload.auth_identity_id,
      email: payload.email ?? null,
      locale: payload.locale,
    };
  }
}
