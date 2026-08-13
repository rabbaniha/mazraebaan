import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import * as crypto from 'crypto';
import { RefreshToken } from './entities/refresh-token.entity';

/** Client context captured when a token is issued — goes into the token row. */
export interface RequestContext {
  ip?: string;
  userAgent?: string;
}

export interface CreateRefreshTokenEntry {
  userId: string;
  deviceId?: string | null;
  /** SHA-256 hex digest of the raw refresh token — never the raw token. */
  tokenHash: string;
  /** Rotation family identifier (shared across the whole chain). */
  familyId: string;
  expiresAt: Date;
  issuedIp: string;
  issuedUserAgent: string;
}

/**
 * Persistence for JWT refresh tokens (Identity bounded context).
 *
 * SECURITY: only SHA-256 hashes of tokens are ever stored (Critical Rule).
 * Rotation is family-based: each fresh pair revokes the previous refresh token
 * and records a new row in the same family.
 */
@Injectable()
export class RefreshTokensService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  /** SHA-256 hex digest of a raw refresh token. Raw tokens are never persisted. */
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async createEntry(input: CreateRefreshTokenEntry): Promise<RefreshToken> {
    const entry = this.refreshTokenRepo.create({
      userId: input.userId,
      deviceId: input.deviceId ?? null,
      tokenHash: input.tokenHash,
      familyId: input.familyId,
      expiresAt: input.expiresAt,
      issuedIp: input.issuedIp,
      issuedUserAgent: input.issuedUserAgent,
      revokedAt: null,
      replacedByTokenId: null,
    });
    return this.refreshTokenRepo.save(entry);
  }

  /** Find an un-revoked, un-expired token by its hash. */
  async findValidByHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.refreshTokenRepo.findOne({
      where: {
        tokenHash,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  /** Revoke a single token by its hash (used during rotation / logout). */
  async revokeByHash(tokenHash: string): Promise<number> {
    const result = await this.refreshTokenRepo.update(
      { tokenHash, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    return result.affected ?? 0;
  }

  /** Revoke every active token of a rotation family (reuse detection / breach). */
  async revokeFamily(familyId: string): Promise<number> {
    const result = await this.refreshTokenRepo.update(
      { familyId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    return result.affected ?? 0;
  }

  /** Revoke every active token of a user (logout from all sessions). */
  async revokeAllForUser(userId: string): Promise<number> {
    const result = await this.refreshTokenRepo.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    return result.affected ?? 0;
  }

  async countActiveForUser(userId: string): Promise<number> {
    return this.refreshTokenRepo.count({
      where: {
        userId,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
  }
}
