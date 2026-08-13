/**
 * JWT configuration for the Identity bounded context.
 *
 * Values come from environment variables (see .env.example at repo root).
 *
 * - Access tokens: 15 minutes (`JWT_ACCESS_TTL`)
 * - Refresh tokens: 30 days (`JWT_REFRESH_TTL`), rotated on every use
 *
 * NOTES:
 * - Secrets here are development-only fallbacks. In production they MUST be
 *   provided via environment variables.
 * - `account_id` is deliberately NOT signed in by this service: accounts are
 *   owned by accounts-service. Per ADR-001 the final token must carry
 *   `account_id` — the api-gateway composites that claim downstream.
 */

const parsePositiveInt = (
  value: string | undefined,
  fallback: number,
): number => {
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const JWT_CONFIG = {
  issuer: 'mazraebaan-identity',

  accessSecret: process.env.JWT_SECRET ?? 'dev-only-access-secret-change-me',
  refreshSecret:
    process.env.JWT_REFRESH_SECRET ??
    process.env.JWT_SECRET ??
    'dev-only-refresh-secret-change-me',

  accessTtlSeconds: parsePositiveInt(process.env.JWT_ACCESS_TTL, 900),
  refreshTtlSeconds: parsePositiveInt(
    process.env.JWT_REFRESH_TTL,
    30 * 24 * 60 * 60,
  ),
} as const;
