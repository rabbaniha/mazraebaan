import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWT_CONFIG } from '../jwt.config';
import { JwtKeysService } from '../jwt-keys.service';
import {
  AccessTokenUser,
  JwtPayload,
} from '../interfaces/jwt-payload.interface';

/**
 * Validates `Authorization: Bearer <access token>` requests.
 *
 * Tokens are signed with RS256 by this service's PRIVATE key; we verify with the
 * PUBLIC key. The same public key is served via JWKS so the gateway and every
 * other internal service can verify access tokens independently.
 *
 * NOTE: identity-service is the token issuer, so it must be able to protect its
 * own endpoints (e.g. GET /auth/me, POST /auth/logout). Downstream services also
 * re-verify tokens with the same public key rather than trusting forwarded claims.
 */
@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly jwtKeys: JwtKeysService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtKeys.getPublicKeyPem(),
      algorithms: [JWT_CONFIG.algorithm],
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
