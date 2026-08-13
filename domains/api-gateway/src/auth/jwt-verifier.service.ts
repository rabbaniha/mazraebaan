import { createPublicKey, type KeyObject } from 'node:crypto';
import jwt, { type JwtPayload as RawPayload } from 'jsonwebtoken';
import type { GatewayConfig } from '../config/gateway.config';

/** The verified access-token claims the gateway forwards downstream. */
export interface AccessTokenPayload {
  sub: string;
  type: 'access';
  auth_identity_id?: string;
  email?: string | null;
  locale?: string;
}

/**
 * Verifies RS256 access tokens using identity-service's PUBLIC key (never the
 * private one). The key comes from a static PEM (`JWT_PUBLIC_KEY`) or, when not
 * configured, is fetched once from the identity-service JWKS endpoint.
 */
export class JwtVerifier {
  private key: KeyObject | null = null;

  constructor(private readonly config: GatewayConfig) {}

  /** Drop the cached key (e.g. after a key rotation). */
  resetCache(): void {
    this.key = null;
  }

  private async getKey(): Promise<KeyObject> {
    if (this.key) {
      return this.key;
    }
    if (this.config.jwtPublicKeyPem.trim().length > 0) {
      this.key = createPublicKey(this.config.jwtPublicKeyPem);
    } else {
      this.key = await this.fetchJwksKey(this.config.jwksUri);
    }
    return this.key;
  }

  private async fetchJwksKey(uri: string): Promise<KeyObject> {
    const res = await fetch(uri);
    if (!res.ok) {
      throw new Error(`Failed to fetch JWKS from ${uri} (status ${res.status})`);
    }
    const body = (await res.json()) as {
      keys?: Array<{ kty?: string; n?: string; e?: string }>;
    };
    const jwk =
      body.keys?.find((k) => k.kty === 'RSA' && k.n && k.e) ??
      body.keys?.[0];
    if (!jwk?.n || !jwk?.e) {
      throw new Error('No usable RSA public key found in JWKS');
    }
    return createPublicKey({
      key: { kty: 'RSA', n: jwk.n, e: jwk.e },
      format: 'jwk',
    });
  }

  /**
   * Verifies the token (signature, expiry, issuer, RS256) and guarantees it is
   * an access token. Throws on any failure.
   */
  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const key = await this.getKey();
    const decoded = jwt.verify(token, key, {
      algorithms: [this.config.algorithm],
      issuer: this.config.issuer,
    }) as RawPayload & Partial<AccessTokenPayload>;

    if (decoded.type !== 'access' || typeof decoded.sub !== 'string') {
      throw new Error('Token is not a valid access token');
    }

    return {
      sub: decoded.sub,
      type: 'access',
      auth_identity_id: decoded.auth_identity_id,
      email: decoded.email ?? null,
      locale: decoded.locale,
    };
  }
}
