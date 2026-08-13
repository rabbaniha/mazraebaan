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
    jwtPublicKeyPem: process.env.JWT_PUBLIC_KEY ?? '',
    jwksUri:
      process.env.JWKS_URI ??
      'http://localhost:4001/auth/.well-known/jwks.json',
    issuer: 'mazraebaan-identity',
    algorithm: 'RS256',
  };
}
