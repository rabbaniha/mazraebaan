import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import * as http from 'node:http';
import { generateKeyPairSync } from 'node:crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtVerifier } from '../src/auth/jwt-verifier.service';
import { createAuthMiddleware } from '../src/auth/auth.middleware';
import { createGatewayProxy } from '../src/proxy/proxy.middleware';
import { loadGatewayConfig } from '../src/config/gateway.config';

const ISSUER = 'mazraebaan-identity';

/**
 * End-to-end test of the stateless gateway:
 *  - auth middleware (JWT verification, claim forwarding, spoof protection)
 *  - proxy middleware (routing + /api/v1 prefix stripping) toward a mock upstream
 */
describe('api-gateway (e2e)', () => {
  let app: NestExpressApplication;
  let mockServer: http.Server;
  let mockUrl: string;
  let privatePem: string;
  let publicPem: string;

  beforeAll(async () => {
    // identity-style RSA keypair: private signs, public verifies.
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicExponent: 0x10001,
    });
    privatePem = privateKey
      .export({ type: 'pkcs8', format: 'pem' })
      .toString();
    publicPem = publicKey
      .export({ type: 'spki', format: 'pem' })
      .toString();

    // Mock upstream that echoes method/path and any forwarded identity claims.
    mockServer = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          method: req.method,
          url: req.url,
          xUserId: req.headers['x-user-id'],
          xAuthIdentity: req.headers['x-auth-identity-id'],
          xEmail: req.headers['x-email'],
        }),
      );
    });
    await new Promise<void>((resolve) => mockServer.listen(0, '127.0.0.1', resolve));
    const addr = mockServer.address() as { port: number };
    mockUrl = `http://127.0.0.1:${addr.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => mockServer.close(() => resolve()));
  });

  beforeEach(async () => {
    process.env.JWT_PUBLIC_KEY = publicPem;
    process.env.IDENTITY_SERVICE_URL = mockUrl;
    process.env.ACCOUNTS_SERVICE_URL = mockUrl;
    process.env.JWKS_URI = mockUrl;

    const config = loadGatewayConfig();
    app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: false,
    });
    app.enableCors();
    const verifier = new JwtVerifier(config);
    app.use(createAuthMiddleware(config, verifier));
    app.use(createGatewayProxy(config));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    delete process.env.JWT_PUBLIC_KEY;
    delete process.env.IDENTITY_SERVICE_URL;
    delete process.env.ACCOUNTS_SERVICE_URL;
    delete process.env.JWKS_URI;
  });

  function makeAccessToken(sub = 'u1'): string {
    return jwt.sign(
      {
        sub,
        type: 'access',
        auth_identity_id: 'ai1',
        email: 'a@b.c',
        locale: 'fa-IR',
      },
      privatePem,
      { algorithm: 'RS256', expiresIn: 900, issuer: ISSUER },
    );
  }

  it('GET /health is public (no token)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => expect(res.body.status).toBe('ok'));
  });

  it('protected route without token -> 401', () => {
    return request(app.getHttpServer()).get('/api/v1/me').expect(401);
  });

  it('protected route with invalid token -> 401', () => {
    return request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', 'Bearer not.a.token')
      .expect(401);
  });

  it('public auth route is proxied without a token (prefix stripped)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ demo: true })
      .expect(200);
    expect(res.body.method).toBe('POST');
    expect(res.body.url).toBe('/auth/login');
  });

  it('protected route verifies the token and forwards identity claims', async () => {
    const token = makeAccessToken('user-123');
    const res = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.url).toBe('/me');
    expect(res.body.xUserId).toBe('user-123');
    expect(res.body.xAuthIdentity).toBe('ai1');
    expect(res.body.xEmail).toBe('a@b.c');
  });

  it('does NOT trust a spoofed x-user-id header', async () => {
    const token = makeAccessToken('legit-user');
    const res = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${token}`)
      .set('x-user-id', 'spoofed')
      .expect(200);
    expect(res.body.xUserId).toBe('legit-user');
    expect(res.body.xUserId).not.toBe('spoofed');
  });

  it('unknown /api/v1 route with a valid token -> 404 (no route to forward)', async () => {
    const token = makeAccessToken();
    return request(app.getHttpServer())
      .get('/api/v1/nope')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});
