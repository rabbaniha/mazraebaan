import type { GatewayConfig } from '../config/gateway.config';

/** Minimal config factory for specs. */
export function testGatewayConfig(
  overrides: Partial<GatewayConfig> = {},
): GatewayConfig {
  return {
    port: 4000,
    identityServiceUrl: 'http://identity.test',
    accountsServiceUrl: 'http://accounts.test',
    farmsServiceUrl: 'http://farms.test',
    internalServiceApiKey: 'test-internal-key',
    accountContextCacheTtlMs: 60_000,
    jwtPublicKeyPem: '',
    jwksUri: 'http://identity.test/auth/.well-known/jwks.json',
    issuer: 'mazraebaan-identity',
    algorithm: 'RS256',
    ...overrides,
  };
}
