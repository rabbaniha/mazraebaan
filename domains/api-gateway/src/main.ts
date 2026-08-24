import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { loadGatewayConfig } from './config/gateway.config';
import { JwtVerifier } from './auth/jwt-verifier.service';
import { createAuthMiddleware } from './auth/auth.middleware';
import { AccountContextService } from './auth/account-context.service';
import { createGatewayProxy } from './proxy/proxy.middleware';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = loadGatewayConfig();
  const logger = new Logger('Bootstrap');

  app.enableCors({ origin: true, credentials: true });

  // Register auth (JWT verification) BEFORE proxy so protected routes are
  // checked before they are forwarded to an internal service.
  const verifier = new JwtVerifier(config);
  const accountContext = new AccountContextService(config);
  app.use(createAuthMiddleware(config, verifier, accountContext));
  app.use(createGatewayProxy(config));

  await app.listen(config.port);
  logger.log(`api-gateway listening on port ${config.port}`);
}

void bootstrap();
