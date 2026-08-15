import { Module } from '@nestjs/common';
import { AccessTokenGuard } from './access-token.guard';
import { JwtPublicKeyService } from './jwt-public-key.service';

@Module({
  providers: [JwtPublicKeyService, AccessTokenGuard],
  exports: [JwtPublicKeyService, AccessTokenGuard],
})
export class AuthModule {}
