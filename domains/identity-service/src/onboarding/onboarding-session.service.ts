import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'node:crypto';
import { Repository } from 'typeorm';
import { OnboardingSession } from './entities/onboarding-session.entity';

const TTL_MINUTES = 30;

@Injectable()
export class OnboardingSessionService {
  constructor(
    @InjectRepository(OnboardingSession)
    private readonly repo: Repository<OnboardingSession>,
  ) {}

  async create(userId: string) {
    const token = randomBytes(32).toString('base64url');
    const session = this.repo.create({
      userId,
      tokenHash: this.hash(token),
      status: 'account_required',
      verificationChannel: null,
      expiresAt: new Date(Date.now() + TTL_MINUTES * 60_000),
      completedAt: null,
    });
    const saved = await this.repo.save(session);
    return { session: saved, token };
  }

  async requireActive(token: string): Promise<OnboardingSession> {
    const session = await this.repo.findOne({
      where: { tokenHash: this.hash(token) },
    });
    if (!session || session.completedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException(
        'Onboarding session is invalid or expired.',
      );
    }
    return session;
  }

  async markVerificationPending(
    session: OnboardingSession,
    channel: 'email' | 'phone',
  ) {
    if (session.status === 'verification_pending') return session;
    if (session.status !== 'account_required')
      throw new ConflictException('Account onboarding has already completed.');
    session.status = 'verification_pending';
    session.verificationChannel = channel;
    return this.repo.save(session);
  }

  async complete(session: OnboardingSession) {
    if (session.status !== 'verification_pending')
      throw new ConflictException(
        'An account must be created before verification.',
      );
    session.status = 'completed';
    session.completedAt = new Date();
    return this.repo.save(session);
  }

  private hash(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
