import { createProxyMiddleware, type Options } from 'http-proxy-middleware';
import * as http from 'node:http';
import type { GatewayConfig } from '../config/gateway.config';

type ServiceKey = 'identity' | 'accounts' | 'farms';

/**
 * Route table: external gateway path prefix → internal service.
 * The `/api/v1` prefix is stripped before forwarding.
 */
const ROUTES: ReadonlyArray<readonly [string, ServiceKey]> = [
  // identity-service (identity bounded context)
  ['/api/v1/auth', 'identity'],
  ['/api/v1/users', 'identity'],
  ['/api/v1/auth-identities', 'identity'],
  ['/api/v1/user-devices', 'identity'],
  ['/api/v1/refresh-tokens', 'identity'],
  ['/api/v1/otp-verifications', 'identity'],
  // accounts-service (account bounded context)
  ['/api/v1/me', 'accounts'],
  ['/api/v1/accounts', 'accounts'],
  ['/api/v1/account-members', 'accounts'],
  ['/api/v1/roles', 'accounts'],
  ['/api/v1/permissions', 'accounts'],
  ['/api/v1/account-invites', 'accounts'],
  ['/api/v1/organizations', 'accounts'],
  ['/api/v1/staff-access-grants', 'accounts'],
  // farms-service (farm bounded context)
  ['/api/v1/farms', 'farms'],
  ['/api/v1/crop-types', 'farms'],
];

/**
 * Builds the stateless reverse proxy. Requests under `/api/v1/*` are forwarded
 * to the matching internal service with the prefix stripped. Requests that do
 * not match any route fall through (Nest returns 404).
 */
export function createGatewayProxy(config: GatewayConfig) {
  const targets: Record<ServiceKey, string> = {
    identity: config.identityServiceUrl.replace(/\/+$/, ''),
    accounts: config.accountsServiceUrl.replace(/\/+$/, ''),
    farms: config.farmsServiceUrl.replace(/\/+$/, ''),
  };

  // Longest prefixes first so `/api/v1/auth-identities` beats `/api/v1/auth`.
  const router: Record<string, string> = {};
  for (const [prefix, serviceKey] of [...ROUTES].sort(
    (a, b) => b[0].length - a[0].length,
  )) {
    router[prefix] = targets[serviceKey];
  }

  const options: Options = {
    // Do not claim health checks or unknown paths. Those must continue through
    // Nest so `/health` is served locally and unknown routes return a normal 404.
    pathFilter: (pathname) =>
      ROUTES.some(
        ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`),
      ),
    changeOrigin: true,
    // Adds X-Forwarded-* headers so services see the real client.
    xfwd: true,
    // Per-request upstream connections (no lingering keep-alive sockets).
    agent: new http.Agent({ keepAlive: false }),
    router,
    // Strip the external `/api/v1` prefix before forwarding to an internal service.
    pathRewrite: {
      '^/api/v1': '',
    },
    on: {
      error: (_err, _req, res) => {
        const r = res as unknown as {
          headersSent?: boolean;
          writeHead?: (
            status: number,
            headers: Record<string, string>,
          ) => unknown;
          end?: (body?: string) => unknown;
        };
        if (!r || typeof r.writeHead !== 'function') {
          return;
        }
        if (!r.headersSent) {
          r.writeHead(502, { 'Content-Type': 'application/json' });
        }
        r.end?.(
          JSON.stringify({
            error: {
              code: 'BAD_GATEWAY',
              message: 'Upstream service is unavailable.',
            },
          }),
        );
      },
    },
  };

  return createProxyMiddleware(options);
}
