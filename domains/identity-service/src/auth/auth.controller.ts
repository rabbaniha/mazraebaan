import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyDto } from './dto/verify.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AccessTokenUser } from './interfaces/jwt-payload.interface';
import { RefreshTokenAuthContext } from './strategies/refresh-token.strategy';
import { CreateAccountDto } from '../onboarding/dto/create-own-account.dto';

interface RequestLike {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
}

/** Two-step guard type — passed through to the service as opaque context. */
type RequestContext = { ip?: string; userAgent?: string };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * Step 1: Create user + auth identity + send OTP.
   * No account is created here — accounts live in accounts-service now.
   */
  @Post('register')
  @Public()
  async register(@Body() dto: RegisterDto, @Req() req: RequestLike) {
    return this.authService.register(dto, this.extractContext(req));
  }

  /**
   * POST /auth/verify
   * Step 2: Verify OTP code → mark identity as verified → activate user.
   */
  @Post('verify')
  @Public()
  async verify(@Body() dto: VerifyDto, @Req() req: RequestLike) {
    return this.authService.verify(
      dto,
      this.extractOnboardingToken(req),
      this.extractContext(req),
    );
  }

  /** Creates the new user's first account; an access token is never accepted here. */
  @Post('onboarding/account')
  @Public()
  createOwnAccount(@Body() dto: CreateAccountDto, @Req() req: RequestLike) {
    return this.authService.createOwnAccount(
      this.extractOnboardingToken(req),
      dto,
    );
  }

  /**
   * POST /auth/login
   * Step 3: Verify credentials → issue a real JWT access + refresh token pair.
   *
   * The frontend then asks accounts-service GET /me for the user's account
   * state (accountIds, ownedAccountId, memberships, requiresAccount).
   */
  @Post('login')
  @Public()
  async login(@Body() dto: LoginDto, @Req() req: RequestLike) {
    return this.authService.login(dto, this.extractContext(req));
  }

  /**
   * POST /auth/refresh
   * Step 4: Rotate a valid refresh token → new access + refresh pair.
   * Body: { "refreshToken": "..." }
   */
  @Post('refresh')
  @Public()
  @UseGuards(AuthGuard('jwt-refresh'))
  async refresh(
    @Body() _dto: RefreshDto,
    @Req() req: { user: RefreshTokenAuthContext },
  ) {
    return this.authService.refresh(
      req.user,
      this.extractContext(req as unknown as RequestLike),
    );
  }

  /**
   * POST /auth/logout
   * Step 5: Revoke the presented refresh token (or every session when
   * `allSessions: true` is sent). The refresh token itself is still validated
   * by the guard so an attacker cannot revoke someone else's session.
   */
  @Post('logout')
  @Public()
  @UseGuards(AuthGuard('jwt-refresh'))
  async logout(
    @Req() req: { user: RefreshTokenAuthContext },
    @Body() dto: LogoutDto,
  ) {
    if (dto.allSessions) {
      const result = await this.authService.logoutAllSessions(req.user.sub);
      return { message: 'All sessions logged out.', ...result };
    }
    const result = await this.authService.logout(req.user.refreshToken);
    return { message: 'Logged out successfully.', ...result };
  }

  /**
   * GET /auth/me
   * Profile endpoint protected by the access-token strategy — proves the
   * `Authorization: Bearer <accessToken>` flow works end to end.
   */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@CurrentUser() user: AccessTokenUser | undefined) {
    if (!user?.userId) {
      throw new Error('Missing authenticated user.');
    }
    return this.authService.me(user.userId);
  }

  // --- Private helpers ---

  private extractContext(req: RequestLike): RequestContext {
    const forwardedFor = req.headers?.['x-forwarded-for'];
    const ip =
      (typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0]?.trim()
        : undefined) ||
      req.ip ||
      undefined;
    const userAgent =
      typeof req.headers?.['user-agent'] === 'string'
        ? req.headers['user-agent']
        : undefined;
    return { ip, userAgent };
  }

  private extractOnboardingToken(req: RequestLike): string {
    const value =
      typeof req.headers?.authorization === 'string'
        ? req.headers.authorization
        : undefined;
    if (!value?.startsWith('Onboarding ')) {
      throw new UnauthorizedException('Missing onboarding session.');
    }
    return value.slice('Onboarding '.length).trim();
  }
}
