import { Injectable, Logger } from '@nestjs/common';
import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  type KeyObject,
} from 'node:crypto';

/**
 * Owns the Identity bounded context signing keypair.
 *
 * The PRIVATE key lives ONLY here (identity-service). Access and refresh tokens
 * are signed with RS256 using this private key. Every other service (api-gateway,
 * accounts, ...) verifies tokens with the PUBLIC key, which is served here via the
 * JWKS endpoint (`GET /auth/.well-known/jwks.json`) or distributed as a static PEM.
 *
 * Key source:
 *  - `JWT_PRIVATE_KEY` (env): PEM string of an RSA private key (recommended).
 *  - otherwise: a fresh 2048-bit RSA key is generated at boot — development only,
 *    tokens are invalidated on restart.
 *
 * `JWT_KID` (env): optional key id, defaults to `mazraebaan-signing-key-v1`.
 */
@Injectable()
export class JwtKeysService {
  private readonly logger = new Logger(JwtKeysService.name);
  private readonly privateKey: KeyObject;
  private readonly publicKey: KeyObject;
  private readonly kid: string;

  constructor() {
    this.kid = process.env.JWT_KID ?? 'mazraebaan-signing-key-v1';

    const pem = process.env.JWT_PRIVATE_KEY;
    if (pem && pem.trim().length > 0) {
      this.privateKey = createPrivateKey(pem);
      this.logger.log('Loaded RSA private key from JWT_PRIVATE_KEY.');
    } else {
      const { privateKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicExponent: 0x10001,
      });
      this.privateKey = privateKey;
      this.logger.warn(
        'No JWT_PRIVATE_KEY set — generated an ephemeral RSA key. ' +
          'Tokens will be invalid after restart; set JWT_PRIVATE_KEY in production.',
      );
    }

    this.publicKey = createPublicKey(this.privateKey);
  }

  getKid(): string {
    return this.kid;
  }

  /** PKCS#8 PEM of the private key. Signing only — must never leave this service. */
  getPrivateKeyPem(): string {
    return this.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  }

  /** SPKI PEM of the public key — for services that prefer a static key. */
  getPublicKeyPem(): string {
    return this.publicKey.export({ type: 'spki', format: 'pem' }).toString();
  }

  /**
   * JWKS document — the public key as a JSON Web Key set, so any service can
   * verify our RS256 signatures remotely and rotate keys without redeploys.
   */
  getJwks(): { keys: Record<string, unknown>[] } {
    const jwk = this.publicKey.export({ format: 'jwk' }) as {
      kty: string;
      n: string;
      e: string;
    };
    return {
      keys: [
        {
          ...jwk,
          use: 'sig',
          alg: 'RS256',
          kid: this.kid,
        },
      ],
    };
  }
}
