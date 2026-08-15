import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ulid } from 'ulid';
import { UsersService } from '../users/users.service';
import { AuthIdentitiesService } from '../auth-identities/auth-identities.service';
import { OtpVerificationsService } from '../otp-verifications/otp-verifications.service';
import { RefreshTokensService } from '../refresh-tokens/refresh-tokens.service';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { VerifyDto } from './dto/verify.dto';
import { LoginDto } from './dto/login.dto';
import { JWT_CONFIG } from './jwt.config';
import { JwtKeysService } from './jwt-keys.service';
import { JwtPayload, TokenPair } from './interfaces/jwt-payload.interface';
import { RefreshTokenAuthContext } from './strategies/refresh-token.strategy';
import { OnboardingSessionService } from '../onboarding/onboarding-session.service';
import { AccountsOnboardingClient } from '../onboarding/accounts-onboarding.client';
import { CreateAccountDto } from '../onboarding/dto/create-own-account.dto';

const BCRYPT_ROUNDS = 12;

/** Captured request context stored on the refresh-token row. */
export interface RequestContext {
  ip?: string;
  userAgent?: string;
}

/**
 * Derive calendar preference from locale.
 * Iran/Afghanistan → jalali, everything else → gregorian.
 */
function calendarPreferenceFromLocale(locale: string): 'jalali' | 'gregorian' {
  const lang = locale.split('-')[0].toLowerCase();
  if (lang === 'fa' || lang === 'ps') {
    return 'jalali';
  }
  return 'gregorian';
}

/**
 * Identity auth — orchestration layer for the Identity bounded context.
 *
 * It NEVER touches entities/repos directly — always delegates to domain services.
 * It NEVER creates accounts or memberships — those now belong to accounts-service.
 *
 * Responsibilities:
 *   - Registration: create user + auth identity → send OTP
 *   - Verification: verify OTP → mark identity as verified
 *   - Login: verify credentials → issue JWT access + refresh token pair
 *   - Refresh: rotate a valid refresh token → new pair (same family)
 *   - Logout: revoke the refresh token (or all sessions)
 *
 * NOT this service's job (moved to accounts-service):
 *   - Account creation / membership creation / account business logic.
 *   The frontend asks accounts-service GET /me for the user's account state.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly authIdentitiesService: AuthIdentitiesService,
    private readonly otpService: OtpVerificationsService,
    private readonly jwtService: JwtService,
    private readonly refreshTokensService: RefreshTokensService,
    private readonly jwtKeys: JwtKeysService,
    private readonly onboardingSessions: OnboardingSessionService,
    private readonly accountsOnboarding: AccountsOnboardingClient,
  ) {}

  // ──────────────────────────────────────────────
  // Step 1: Register — create a pending identity and an onboarding session.
  // ──────────────────────────────────────────────

  async register(dto: RegisterDto, _requestContext: RequestContext) {
    // 1. Determine locale/timezone/calendar
    const locale = dto.locale || 'fa-IR';
    const timezone = dto.timezone || 'Asia/Tehran';
    const calendarPreference = calendarPreferenceFromLocale(locale);

    // 2. Create User via UsersService (NOT via repo directly)
    const normalizedEmail = dto.email?.trim().toLowerCase();
    const phoneE164 = dto.phoneNumber && dto.phoneCountryCode
      ? `+${dto.phoneCountryCode}${dto.phoneNumber}` : undefined;
    const user = await this.usersService.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      displayName: `${dto.firstName} ${dto.lastName}`,
      email: normalizedEmail,
      phoneNumber: dto.phoneNumber,
      phoneCountryCode: dto.phoneCountryCode,
      locale,
      timezone,
      calendarPreference,
    });

    // 3. Hash password
    const credentialHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // 4. Create a password identity for the preferred contact.
    const providerType = normalizedEmail ? 'email_password' : 'phone_password';
    const providerSubject = normalizedEmail ?? phoneE164!;
    const identity = await this.authIdentitiesService.createForUser(
      user.id,
      providerType,
      providerSubject,
      {
        emailNormalized: normalizedEmail,
        phoneE164,
        credentialHash,
        isPrimary: true,
      },
    );

    // No OTP and no access token are issued until the first account exists.
    const { session, token } = await this.onboardingSessions.create(user.id);

    // 6. Return safe response
    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        email: user.email,
        locale: user.locale,
        timezone: user.timezone,
        calendarPreference: user.calendarPreference,
        status: user.status,
        createdAt: user.createdAt,
      },
      message: 'Registration is pending. Create your account to continue.',
      identityId: identity.id,
      onboardingToken: token,
      onboardingExpiresAt: session.expiresAt,
    };
  }

  // ──────────────────────────────────────────────
  // Step 2: Create own account, then start contact verification.
  // ──────────────────────────────────────────────

  async createOwnAccount(token: string, dto: CreateAccountDto) {
    const session = await this.onboardingSessions.requireActive(token);
    if (session.status === 'verification_pending') {
      return { message: 'Account already created. Verify your contact to continue.' };
    }
    const user = await this.usersService.findOne(session.userId);
    if (!user) throw new NotFoundException('User not found.');
    const provisioned = await this.accountsOnboarding.provisionOwnerAccount(user.id, dto);
    const channel = user.email ? 'email' : 'phone';
    await this.onboardingSessions.markVerificationPending(session, channel);
    await this.otpService.requestOtp({
      purpose: channel === 'email' ? 'register_email' : 'register_phone',
      email: channel === 'email' ? user.email ?? undefined : undefined,
      phone: channel === 'phone' ? `+${user.phoneCountryCode}${user.phoneNumber}` : undefined,
      userId: user.id,
    });
    return { message: 'Account created. Verification code sent.', accountId: provisioned.account.id, verificationChannel: channel };
  }

  // Step 3: Verify OTP → activate identity and issue the first token pair.
  async verify(dto: VerifyDto, token?: string, requestContext: RequestContext = {}) {
    if (!token) throw new UnauthorizedException('Onboarding session is required.');
    const session = await this.onboardingSessions.requireActive(token);
    if (session.status !== 'verification_pending' || !session.verificationChannel) {
      throw new UnauthorizedException('Create an account before verification.');
    }
    const user = await this.usersService.findOne(session.userId);
    if (!user) throw new NotFoundException('User not found.');
    const identity = (await this.authIdentitiesService.findByUserId(user.id)).find((item) => item.isPrimary);
    if (!identity) throw new UnauthorizedException('No primary identity found.');

    await this.otpService.verifyOtp({
      purpose: session.verificationChannel === 'email' ? 'register_email' : 'register_phone',
      code: dto.code,
      userId: user.id,
    });
    await this.authIdentitiesService.markVerified(identity.id);
    await this.usersService.activate(identity.userId);
    await this.onboardingSessions.complete(session);
    const tokens = await this.issueTokens(user, identity.id, requestContext);
    return {
      message: 'Registration completed successfully.',
      userId: identity.userId,
      ...tokens,
    };
  }

  // ──────────────────────────────────────────────
  // Step 3: Login — verify credentials → issue JWT pair
  // ──────────────────────────────────────────────

  async login(dto: LoginDto, requestContext: RequestContext = {}) {
    const normalizedEmail = dto.email?.trim().toLowerCase();
    const phoneE164 = dto.phoneNumber && dto.phoneCountryCode
      ? `+${dto.phoneCountryCode}${dto.phoneNumber}` : undefined;
    const identity = await this.authIdentitiesService.findByProvider(
      normalizedEmail ? 'email_password' : 'phone_password',
      normalizedEmail ?? phoneE164!,
    );
    if (!identity) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (!identity.isVerified) {
      throw new UnauthorizedException('Contact is not verified yet.');
    }

    if (!identity.credentialHash) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isValid = await bcrypt.compare(dto.password, identity.credentialHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const user = await this.usersService.findOne(identity.userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    this.assertUsableUser(user);

    // Record usage
    await this.authIdentitiesService.recordUsage(identity.id);
    // Touch last login
    await this.usersService.activate(user.id);

    const tokens = await this.issueTokens(user, identity.id, requestContext);

    return {
      message: 'Login successful.',
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        locale: user.locale,
        timezone: user.timezone,
        calendarPreference: user.calendarPreference,
        status: user.status,
      },
      // TODO: publish user.logged_in via Outbox Pattern
    };
  }

  // ──────────────────────────────────────────────
  // Step 4: Refresh — rotate refresh token → new JWT pair
  // ──────────────────────────────────────────────

  /**
   * Rotate a validated refresh token.
   *
   * @param context built by RefreshTokenStrategy ('jwt-refresh' guard) — it
   *   carries the verified payload AND the raw token extracted from the body.
   */
  async refresh(
    context: RefreshTokenAuthContext,
    requestContext: RequestContext = {},
  ) {
    const tokenHash = RefreshTokensService.hashToken(context.refreshToken);

    // The strategy already verified the signature; double-check the server-side
    // record is still active (not revoked, not expired).
    const stored = await this.refreshTokensService.findValidByHash(tokenHash);
    if (!stored) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const user = await this.usersService.findOne(context.sub);
    if (!user) {
      await this.refreshTokensService.revokeFamily(context.family_id ?? '');
      throw new UnauthorizedException('User no longer exists.');
    }
    this.assertUsableUser(user);

    // Rotation: revoke the used refresh token, then issue a fresh pair that
    // keeps the same rotation family (so chains stay traceable).
    await this.refreshTokensService.revokeByHash(tokenHash);

    return this.issueTokens(user, context.auth_identity_id, requestContext, {
      familyId: context.family_id,
    });
  }
  // ──────────────────────────────────────────────
  // Step 5: Logout — revoke refresh token(s)
  // ──────────────────────────────────────────────

  async logout(rawRefreshToken: string): Promise<{ revoked: number }> {
    const revoked = await this.refreshTokensService.revokeByHash(
      RefreshTokensService.hashToken(rawRefreshToken),
    );
    return { revoked };
  }

  async logoutAllSessions(userId: string): Promise<{ revoked: number }> {
    const revoked = await this.refreshTokensService.revokeAllForUser(userId);
    return { revoked };
  }

  // ──────────────────────────────────────────────
  // GET /auth/me — profile behind the access-token guard
  // ──────────────────────────────────────────────

  async me(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        avatarUrl: user.avatarUrl,
        locale: user.locale,
        timezone: user.timezone,
        calendarPreference: user.calendarPreference,
        status: user.status,
        createdAt: user.createdAt,
      },
    };
  }

  // ──────────────────────────────────────────────
  // Token issuance (private)
  // ──────────────────────────────────────────────

  private async issueTokens(
    user: User,
    authIdentityId: string | undefined,
    context: RequestContext,
    options: { familyId?: string } = {},
  ): Promise<TokenPair> {
    if (!(await this.accountsOnboarding.hasActiveAccount(user.id))) {
      throw new UnauthorizedException('An active account is required before tokens can be issued.');
    }
    const now = new Date();

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        type: 'access',
        auth_identity_id: authIdentityId,
        email: user.email,
        locale: user.locale,
        onboarding_completed: true,
      } satisfies JwtPayload,
      {
        secret: this.jwtKeys.getPrivateKeyPem(),
        algorithm: JWT_CONFIG.algorithm,
        keyid: this.jwtKeys.getKid(),
        expiresIn: JWT_CONFIG.accessTtlSeconds,
        issuer: JWT_CONFIG.issuer,
      },
    );

    // Refresh token: unique jti + rotation family. The family is preserved
    // across rotations so every chain of tokens is traceable.
    const familyId = options.familyId ?? ulid();
    const jti = ulid();
    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        type: 'refresh',
        auth_identity_id: authIdentityId,
        jti,
        family_id: familyId,
        onboarding_completed: true,
      } satisfies JwtPayload,
      {
        secret: this.jwtKeys.getPrivateKeyPem(),
        algorithm: JWT_CONFIG.algorithm,
        keyid: this.jwtKeys.getKid(),
        expiresIn: JWT_CONFIG.refreshTtlSeconds,
        issuer: JWT_CONFIG.issuer,
      },
    );

    const expiresAt = new Date(
      now.getTime() + JWT_CONFIG.refreshTtlSeconds * 1000,
    );
    await this.refreshTokensService.createEntry({
      userId: user.id,
      tokenHash: RefreshTokensService.hashToken(refreshToken),
      familyId,
      expiresAt,
      issuedIp: context.ip ?? '0.0.0.0',
      issuedUserAgent: context.userAgent ?? 'unknown',
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: JWT_CONFIG.accessTtlSeconds,
    };
  }

  private assertUsableUser(user: User): void {
    if (user.status === 'blocked') {
      throw new UnauthorizedException('User account is blocked.');
    }
    if (user.status === 'deleted') {
      throw new UnauthorizedException('User account is no longer available.');
    }
  }
}
