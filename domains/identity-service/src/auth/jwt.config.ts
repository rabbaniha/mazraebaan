/**
 * JWT configuration for the Identity bounded context.
 *
 * Tokens are signed with **asymmetric cryptography (RS256)**. The RSA PRIVATE key
 * lives ONLY in identity-service (see `JwtKeysService`); every other service
 * verifies tokens with the PUBLIC key served here via JWKS
 * (`GET /auth/.well-known/jwks.json`) or a static PEM.
 *
 * - Access tokens: 15 minutes (`JWT_ACCESS_TTL`)
 * - Refresh tokens: 30 days (`JWT_REFRESH_TTL`), rotated on every use
 * - Algorithm: `RS256`
 *
 * NOTES:
 * - The private key is loaded from `JWT_PRIVATE_KEY` (PEM) or generated ephemeral
 *   in development. It must NEVER leave this service.
 * - `account_id` is deliberately NOT signed in by this service: accounts are
 *   owned by accounts-service. The api-gateway forwards the identity claims and
 *   the frontend fetches account state from accounts-service `GET /me`.
 */

const parsePositiveInt = (
  value: string | undefined,
  fallback: number,
): number => {
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const JWT_CONFIG = {
  /** JWT `iss` claim — all services must check it during verification. */
  issuer: 'mazraebaan-identity',
  /** Signature algorithm. Access + refresh tokens share the RS256 keypair. */
  algorithm: 'RS256' as const,

  accessTtlSeconds: parsePositiveInt(process.env.JWT_ACCESS_TTL, 900),
  refreshTtlSeconds: parsePositiveInt(
    process.env.JWT_REFRESH_TTL,
    30 * 24 * 60 * 60,
  ),
} as const;

