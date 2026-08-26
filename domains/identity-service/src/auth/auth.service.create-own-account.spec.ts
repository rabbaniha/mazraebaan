import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ulid } from 'ulid';
import { AuthService } from '../auth/auth.service';
import { OnboardingSessionService } from '../onboarding/onboarding-session.service';
import { AccountsOnboardingClient } from '../onboarding/accounts-onboarding.client';
import { OutboxService } from '../events/outbox.service';
import { CreateAccountDto } from '../onboarding/dto/create-own-account.dto';
import { OnboardingSession } from '../onboarding/entities/onboarding-session.entity';
import { UsersService } from '../users/users.service';
import { AuthIdentitiesService } from '../auth-identities/auth-identities.service';
import { OtpVerificationsService } from '../otp-verifications/otp-verifications.service';
import { JwtService } from '@nestjs/jwt';

/* eslint-disable @typescript-eslint/unbound-method */

const makeSession = (
  overrides: Partial<OnboardingSession> = {},
): OnboardingSession =>
  ({
    id: ulid(),
    userId: ulid(),
    tokenHash: 'hash',
    status: 'account_required',
    verificationChannel: null,
    expiresAt: new Date(Date.now() + 30 * 60_000),
    completedAt: null,
    createdAt: new Date(),
    ...overrides,
  }) as OnboardingSession;

describe('AuthService.createOwnAccount (identity)', () => {
  let service: AuthService;
  let sessions: jest.Mocked<OnboardingSessionService>;
  let accounts: jest.Mocked<AccountsOnboardingClient>;
  let outbox: { enqueue: jest.Mock };
  let users: jest.Mocked<UsersService>;
  let otp: jest.Mocked<OtpVerificationsService>;
  let dataSource: { transaction: jest.Mock };

  const accountDto: CreateAccountDto = {
    displayName: 'مزرعه سارا',
    dataRegion: 'ir',
  };

  beforeEach(async () => {
    sessions = {
      requireActive: jest.fn(),
      markVerificationPending: jest.fn((s: OnboardingSession) => s) as never,
    } as unknown as jest.Mocked<OnboardingSessionService>;

    accounts = {
      hasActiveAccount: jest.fn(() => true) as never,
    };

    outbox = { enqueue: jest.fn().mockResolvedValue({ id: ulid() }) };

    users = {
      findOne: jest.fn(),
      activate: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    otp = {
      requestOtp: jest.fn(),
      verifyOtp: jest.fn(),
    } as unknown as jest.Mocked<OtpVerificationsService>;

    dataSource = {
      transaction: jest.fn((cb: (manager: EntityManager) => Promise<void>) =>
        cb({} as EntityManager),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    })
      .useMocker((token) => {
        if (token === OnboardingSessionService) return sessions;
        if (token === AccountsOnboardingClient) return accounts;
        if (token === OutboxService) return outbox;
        if (token === UsersService) return users;
        if (token === AuthIdentitiesService)
          return { findByUserId: jest.fn() } as never;
        if (token === OtpVerificationsService) return otp;
        if (token === JwtService) return { signAsync: jest.fn() } as never;
        if (token === DataSource) return dataSource;
        return {};
      })
      .compile();

    service = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('commits the outbox event in the same transaction and starts email verification', async () => {
    const userId = ulid();
    const session = makeSession({ userId, status: 'account_required' });
    sessions.requireActive.mockResolvedValue(session);
    users.findOne.mockResolvedValue({
      id: userId,
      email: 'sara@example.com',
      phoneNumber: null,
      phoneCountryCode: null,
    } as never);

    const result = await service.createOwnAccount('raw-token', accountDto);

    expect(sessions.requireActive).toHaveBeenCalledWith('raw-token');
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(outbox.enqueue).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        eventType: 'account.provisioning.requested',
        aggregateId: session.id,
        payload: { userId, account: accountDto },
      }),
    );
    expect(sessions.markVerificationPending).toHaveBeenCalledWith(
      session,
      'email',
      expect.anything(),
    );
    expect(otp.requestOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        purpose: 'register_email',
        email: 'sara@example.com',
        userId,
      }),
    );
    expect(result.verificationChannel).toBe('email');
    expect((result as { accountId?: string }).accountId).toBeUndefined();
  });

  it('uses the phone channel when the user has no email', async () => {
    const userId = ulid();
    const session = makeSession({ userId });
    sessions.requireActive.mockResolvedValue(session);
    users.findOne.mockResolvedValue({
      id: userId,
      email: null,
      phoneNumber: '9120000000',
      phoneCountryCode: '98',
    } as never);

    const result = await service.createOwnAccount('raw-token', accountDto);

    expect(sessions.markVerificationPending).toHaveBeenCalledWith(
      session,
      'phone',
      expect.anything(),
    );
    expect(otp.requestOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        purpose: 'register_phone',
        phone: '+989120000000',
        userId,
      }),
    );
    expect(result.verificationChannel).toBe('phone');
  });

  it('rejects when the onboarding session is invalid', async () => {
    sessions.requireActive.mockRejectedValue(new UnauthorizedException('bad'));
    await expect(
      service.createOwnAccount('bad', accountDto),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(outbox.enqueue).not.toHaveBeenCalled();
  });

  it('reports already-created when the session is already verification_pending', async () => {
    const session = makeSession({
      status: 'verification_pending',
      verificationChannel: 'email',
    });
    sessions.requireActive.mockResolvedValue(session);

    const result = await service.createOwnAccount('raw-token', accountDto);

    expect(outbox.enqueue).not.toHaveBeenCalled();
    expect(result.message).toMatch(/already created/i);
  });

  it('throws NotFoundException when the user behind the session no longer exists', async () => {
    const session = makeSession({ userId: ulid() });
    sessions.requireActive.mockResolvedValue(session);
    users.findOne.mockResolvedValue(null);

    await expect(
      service.createOwnAccount('raw-token', accountDto),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
