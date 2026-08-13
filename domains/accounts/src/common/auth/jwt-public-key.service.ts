import { Injectable, Logger } from '@nestjs/common';
import { createPublicKey, type KeyObject } from 'node:crypto';

/**
 * Provides identity-service's PUBLIC key so this service can independently
 * verify RS256 access tokens — it never holds (and never needs) the private key.
 *
 * Key source:
 *  - `JWT_PUBLIC_KEY` (env): static PEM of the public key (recommended for prod).
 *  - otherwise: fetched once from `JWKS_URI` (identity-service JWKS endpoint).
 */
@Injectable()
export class JwtPublicKeyService {
  private readonly logger = new Logger(JwtPublicKeyService.name);
  private key: KeyObject | null = null;

  async getPublicKey(): Promise<KeyObject> {
    if (this.key) {
      return this.key;
    }

    const pem = process.env.JWT_PUBLIC_KEY;
    if (pem && pem.trim().length > 0) {
      this.key = createPublicKey(pem);
    } else {
      const uri =
        process.env.JWKS_URI ??
        'http://localhost:4001/auth/.well-known/jwks.json';
      this.key = await this.fetchJwksKey(uri);
      this.logger.log(`Fetched JWKS public key from ${uri}`);
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
}