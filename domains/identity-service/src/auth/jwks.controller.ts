import { Controller, Get } from '@nestjs/common';
import { JwtKeysService } from './jwt-keys.service';
import { Public } from './decorators/public.decorator';

/**
 * Publishes the identity-service public signing key as a JSON Web Key Set (JWKS).
 *
 * The gateway and every internal service fetch this endpoint (or a static PEM)
 * to independently verify RS256 access tokens without ever holding the private
 * key. Public — no authentication required.
 *
 * Route: `GET /auth/.well-known/jwks.json`
 */
@Controller('auth')
export class JwksController {
  constructor(private readonly jwtKeys: JwtKeysService) {}

  @Get('.well-known/jwks.json')
  @Public()
  getJwks() {
    return this.jwtKeys.getJwks();
  }
}
