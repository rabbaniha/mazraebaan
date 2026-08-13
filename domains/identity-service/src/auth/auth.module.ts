import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { AuthIdentitiesModule } from '../auth-identities/auth-identities.module';
import { OtpVerificationsModule } from '../otp-verifications/otp-verifications.module';
import { RefreshTokensModule } from '../refresh-tokens/refresh-tokens.module';
import { AccessTokenStrategy } from './strategies/access-token.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { JWT_CONFIG } from './jwt.config';

@Module({
  imports: [
    UsersModule,
    AuthIdentitiesModule,
    OtpVerificationsModule,
    RefreshTokensModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: JWT_CONFIG.accessSecret,
      signOptions: {
        expiresIn: JWT_CONFIG.accessTtlSeconds,
        issuer: JWT_CONFIG.issuer,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AccessTokenStrategy, RefreshTokenStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
