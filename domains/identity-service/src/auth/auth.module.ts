import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtKeysService } from './jwt-keys.service';
import { JwtKeysModule } from './jwt-keys.module';
import { JwksController } from './jwks.controller';
import { UsersModule } from '../users/users.module';
import { AuthIdentitiesModule } from '../auth-identities/auth-identities.module';
import { OtpVerificationsModule } from '../otp-verifications/otp-verifications.module';
import { RefreshTokensModule } from '../refresh-tokens/refresh-tokens.module';
import { AccessTokenStrategy } from './strategies/access-token.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { JWT_CONFIG } from './jwt.config';
import { AccessTokenGuard } from './guards/access-token.guard';

@Module({
  imports: [
    UsersModule,
    AuthIdentitiesModule,
    OtpVerificationsModule,
    RefreshTokensModule,
    JwtKeysModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [JwtKeysModule],
      inject: [JwtKeysService],
      useFactory: (jwtKeys: JwtKeysService) => ({
        secret: jwtKeys.getPrivateKeyPem(),
        signOptions: {
          algorithm: JWT_CONFIG.algorithm,
          expiresIn: JWT_CONFIG.accessTtlSeconds,
          issuer: JWT_CONFIG.issuer,
          keyid: jwtKeys.getKid(),
        },
      }),
    }),
  ],
  controllers: [AuthController, JwksController],
  providers: [
    AuthService,
    AccessTokenGuard,
    AccessTokenStrategy,
    RefreshTokenStrategy,
  ],
  exports: [AuthService, JwtModule, JwtKeysModule],
})
export class AuthModule {}
