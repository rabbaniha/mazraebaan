import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ulid } from 'ulid';
import { OnboardingSessionService } from './onboarding-session.service';
import { OnboardingSession } from './entities/onboarding-session.entity';

const TTL_MINUTES = 30;

function makeSession(
  overrides: Partial<OnboardingSession> = {},
): OnboardingSession {
  return {
    id: ulid(),
    userId: ulid(),
    tokenHash: 'hash',
    status: 'account_required',
    verificationChannel: null,
    expiresAt: new Date(Date.now() + TTL_MINUTES * 60_000),
    completedAt: null,
    createdAt: new Date(),
    ...overrides,
  } as OnboardingSession;
}

describe('OnboardingSessionService (identity)', () => {
  let service: OnboardingSessionService;
  let repo: jest.Mocked<Repository<OnboardingSession>>;

  beforeEach(async () => {
    repo = {
      create: jest.fn((e: OnboardingSession) => e),
      save: jest.fn((e: OnboardingSession) => e) as never,
      findOne: jest.fn() as never,
    } as unknown as jest.Mocked<Repository<OnboardingSession>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingSessionService,
        { provide: getRepositoryToken(OnboardingSession), useValue: repo },
      ],
    }).compile();

    service = module.get(OnboardingSessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('stores only the SHA-256 hash of the token, never the raw token', async () => {
      const { token } = await service.create(ulid());

      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(20);
      const saved = repo.save.mock.calls[0][0] as OnboardingSession;
      expect(saved.tokenHash).not.toBe(token);
      expect(saved.tokenHash).toMatch(/^[0-9a-f]{64}$/); // sha256 hex
      expect(saved.status).toBe('account_required');
      expect(saved.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('requireActive', () => {
    it('rejects an unknown token', async () => {
      repo.findOne = jest.fn(() => null) as never;
      await expect(
        service.requireActive('does-not-exist'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an already-completed session', async () => {
      repo.findOne = jest.fn(() =>
        makeSession({ completedAt: new Date() }),
      ) as never;
      await expect(service.requireActive('tok')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects an expired session', async () => {
      repo.findOne = jest.fn(() =>
        makeSession({ expiresAt: new Date(Date.now() - 1000) }),
      ) as never;
      await expect(service.requireActive('tok')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('returns the session for a valid, unexpired, incomplete token', async () => {
      const session = makeSession();
      repo.findOne = jest.fn(() => session) as never;
      await expect(service.requireActive('tok')).resolves.toBe(session);
    });
  });

  describe('markVerificationPending', () => {
    it('moves account_required -> verification_pending and records the channel', async () => {
      const session = makeSession();
      const saved = await service.markVerificationPending(session, 'email');
      expect(saved.status).toBe('verification_pending');
      expect(saved.verificationChannel).toBe('email');
    });

    it('is idempotent when already pending', async () => {
      const session = makeSession({
        status: 'verification_pending',
        verificationChannel: 'email',
      });
      const saved = await service.markVerificationPending(session, 'phone');
      expect(saved.status).toBe('verification_pending');
      expect(saved.verificationChannel).toBe('email'); // unchanged
    });

    it('conflicts when onboarding already completed', async () => {
      const session = makeSession({
        status: 'completed',
        completedAt: new Date(),
      });
      await expect(
        service.markVerificationPending(session, 'email'),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('complete', () => {
    it('requires verification_pending before completing', async () => {
      const session = makeSession({ status: 'account_required' });
      await expect(service.complete(session)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('marks the session completed with a timestamp', async () => {
      const session = makeSession({
        status: 'verification_pending',
        verificationChannel: 'email',
      });
      const saved = await service.complete(session);
      expect(saved.status).toBe('completed');
      expect(saved.completedAt).toBeInstanceOf(Date);
    });
  });
});
