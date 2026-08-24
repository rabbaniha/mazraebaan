/**
 * api-gateway configuration — read from environment variables.
 *
 * The gateway is the single external entry point to the microservices. It has
 * NO database and NO business logic: it only verifies access tokens and proxies
 * requests to internal services.
 */
export interface GatewayConfig {
  /** Gateway HTTP port (external entry point). */
  port: number;
  /** Internal base URL of identity-service. */
  identityServiceUrl: string;
  /** Internal base URL of accounts-service. */
  accountsServiceUrl: string;
  /** Internal base URL of farms-service. */
  farmsServiceUrl: string;
  /**
   * Shared secret for internal service-to-service calls (accounts-service
   * `x-internal-service-key` guard). Required so the gateway can resolve the
   * caller's active account (ADR-001) and forward `x-account-id`.
   */
  internalServiceApiKey: string;
  /**
   * TTL (ms) for cached user → active-account resolutions. Short on purpose:
   * membership changes take effect quickly while still shielding
   * accounts-service from a lookup on every request.
   */
  accountContextCacheTtlMs: number;
  /**
   * Static public key (PEM) used to verify access tokens. When empty, the
   * public key is fetched from `jwksUri` (identity-service JWKS endpoint).
   */
  jwtPublicKeyPem: string;
  /** identity-service JWKS endpoint for remote key discovery. */
  jwksUri: string;
  /** Expected JWT `iss` claim. */
  issuer: string;
  /** JWT signature algorithm (asymmetric). */
  algorithm: 'RS256';
}

export function loadGatewayConfig(): GatewayConfig {
  return {
    port: parseInt(process.env.PORT ?? '4000', 10),
    identityServiceUrl:
      process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:4001',
    accountsServiceUrl:
      process.env.ACCOUNTS_SERVICE_URL ?? 'http://localhost:4002',
    farmsServiceUrl: process.env.FARMS_SERVICE_URL ?? 'http://localhost:4003',
    internalServiceApiKey: process.env.INTERNAL_SERVICE_API_KEY ?? '',
    accountContextCacheTtlMs: parseInt(
      process.env.ACCOUNT_CONTEXT_CACHE_TTL_MS ?? '60000',
      10,
    ),
    jwtPublicKeyPem: process.env.JWT_PUBLIC_KEY ?? '',
    jwksUri:
      process.env.JWKS_URI ??
      'http://localhost:4001/auth/.well-known/jwks.json',
    issuer: 'mazraebaan-identity',
    algorithm: 'RS256',
  };
}
