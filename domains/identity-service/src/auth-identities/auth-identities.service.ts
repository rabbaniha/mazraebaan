import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthIdentity } from './entities/auth-identity.entity';
import { UpdateAuthIdentityDto } from './dto/update-auth-identity.dto';

@Injectable()
export class AuthIdentitiesService {
  constructor(
    @InjectRepository(AuthIdentity)
    private readonly authIdentityRepo: Repository<AuthIdentity>,
  ) {}

  /**
   * Create an auth identity for a user.
   * Checks (provider_type, provider_subject) uniqueness.
   */
  async createForUser(
    userId: string,
    providerType: AuthIdentity['providerType'],
    providerSubject: string,
    options: {
      emailNormalized?: string;
      phoneE164?: string;
      credentialHash?: string;
      isPrimary?: boolean;
      metadata?: Record<string, unknown>;
    } = {},
  ): Promise<AuthIdentity> {
    // Check uniqueness
    const existing = await this.authIdentityRepo.findOne({
      where: { providerType, providerSubject },
    });
    if (existing) {
      throw new ConflictException(
        'An account with this credential already exists',
      );
    }

    const identity = this.authIdentityRepo.create({
      userId,
      providerType,
      providerSubject,
      emailNormalized: options.emailNormalized ?? null,
      phoneE164: options.phoneE164 ?? null,
      credentialHash: options.credentialHash ?? null,
      isPrimary: options.isPrimary ?? false,
      isVerified: false,
      metadata: options.metadata ?? null,
    });
    return this.authIdentityRepo.save(identity);
  }

  /**
   * Mark an identity as verified.
   */
  async markVerified(identityId: string): Promise<AuthIdentity | null> {
    const identity = await this.authIdentityRepo.findOne({
      where: { id: identityId },
    });
    if (!identity) return null;
    identity.isVerified = true;
    identity.verifiedAt = new Date();
    return this.authIdentityRepo.save(identity);
  }

  /**
   * Find identity by provider (e.g., email_password + email).
   */
  async findByProvider(
    providerType: AuthIdentity['providerType'],
    providerSubject: string,
  ): Promise<AuthIdentity | null> {
    return this.authIdentityRepo.findOne({
      where: { providerType, providerSubject },
    });
  }

  /**
   * Find all identities for a user.
   */
  async findByUserId(userId: string): Promise<AuthIdentity[]> {
    return this.authIdentityRepo.find({ where: { userId } });
  }

  /**
   * Find a specific identity by ID.
   */
  async findOne(id: string): Promise<AuthIdentity | null> {
    return this.authIdentityRepo.findOne({ where: { id } });
  }

  /**
   * Update last_used_at timestamp.
   */
  async recordUsage(identityId: string): Promise<void> {
    await this.authIdentityRepo.update(identityId, {
      lastUsedAt: new Date(),
    });
  }

  // --- Standard CRUD (for direct admin use) ---

  async findAll(): Promise<AuthIdentity[]> {
    return this.authIdentityRepo.find();
  }

  async update(
    id: string,
    dto: UpdateAuthIdentityDto,
  ): Promise<AuthIdentity | null> {
    const identity = await this.authIdentityRepo.findOne({ where: { id } });
    if (!identity) return null;
    Object.assign(identity, dto);
    return this.authIdentityRepo.save(identity);
  }

  async remove(id: string): Promise<boolean> {
    const identity = await this.authIdentityRepo.findOne({ where: { id } });
    if (!identity) return false;
    await this.authIdentityRepo.remove(identity);
    return true;
  }
}
