import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { AccountInvite } from './entities/account-invite.entity';
import { CreateAccountInviteDto } from './dto/create-account-invite.dto';
import { UpdateAccountInviteDto } from './dto/update-account-invite.dto';
import { AccountMembersService } from '../account-members/account-members.service';

const INVITE_TTL_DAYS = 7;

/**
 * Invitation lifecycle (Rules 5–9):
 *   - Always initiated by an account owner/admin (createdBy)
 *   - Bound to an email (Rule 6)
 *   - Requires a secure token (Rule 7)
 *   - Has an expiration (Rule 8)
 *   - Can be revoked (Rule 9)
 *
 * Accepting an invitation is the ONLY path that creates an AccountMember (Rule 3):
 *   "Membership can ONLY be created from an invitation."
 */
@Injectable()
export class AccountInvitesService {
  constructor(
    @InjectRepository(AccountInvite)
    private readonly inviteRepo: Repository<AccountInvite>,
    private readonly accountMembersService: AccountMembersService,
  ) {}

  async create(
    dto: CreateAccountInviteDto,
    createdBy: string,
  ): Promise<AccountInvite> {
    const expiresAt = dto.expiresAt
      ? new Date(dto.expiresAt)
      : new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

    const invite = this.inviteRepo.create({
      accountId: dto.accountId,
      email: dto.email.trim().toLowerCase(),
      token: this.generateToken(),
      roleIds: dto.roleIds ?? [],
      status: 'pending',
      expiresAt,
      createdBy,
    });
    return this.inviteRepo.save(invite);
  }

  async findAll(): Promise<AccountInvite[]> {
    return this.inviteRepo.find();
  }

  async findOne(id: string): Promise<AccountInvite | null> {
    return this.inviteRepo.findOne({ where: { id } });
  }

  async findByToken(token: string): Promise<AccountInvite | null> {
    return this.inviteRepo.findOne({ where: { token } });
  }

  /**
   * Accept a pending, non-expired invitation.
   * Creates the AccountMember (status: invited) — enforcing Rule 3.
   * The invitee's userId comes from the authenticated identity (JWT).
   */
  async accept(id: string, userId: string): Promise<AccountInvite> {
    const invite = await this.inviteRepo.findOne({ where: { id } });
    if (!invite) {
      throw new NotFoundException('Invitation not found');
    }
    if (invite.status !== 'pending') {
      throw new ConflictException('Invitation is no longer pending');
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Invitation has expired');
    }

    invite.status = 'accepted';
    invite.acceptedAt = new Date();
    await this.inviteRepo.save(invite);

    // Membership can ONLY be created from an accepted invitation (Rule 3).
    await this.accountMembersService.create({
      accountId: invite.accountId,
      userId,
      invitedAt: new Date().toISOString(),
      invitedBy: invite.createdBy,
      roleIds: invite.roleIds,
    });

    return invite;
  }

  async revoke(id: string): Promise<AccountInvite | null> {
    const invite = await this.inviteRepo.findOne({ where: { id } });
    if (!invite) return null;
    if (invite.status !== 'pending') {
      throw new ConflictException('Only pending invitations can be revoked');
    }
    invite.status = 'revoked';
    invite.revokedAt = new Date();
    return this.inviteRepo.save(invite);
  }

  async decline(id: string): Promise<AccountInvite | null> {
    const invite = await this.inviteRepo.findOne({ where: { id } });
    if (!invite) return null;
    if (invite.status !== 'pending') {
      throw new ConflictException('Invitation is no longer pending');
    }
    invite.status = 'declined';
    return this.inviteRepo.save(invite);
  }

  async update(
    id: string,
    dto: UpdateAccountInviteDto,
  ): Promise<AccountInvite | null> {
    const invite = await this.inviteRepo.findOne({ where: { id } });
    if (!invite) return null;
    if (dto.expiresAt !== undefined) invite.expiresAt = new Date(dto.expiresAt);
    return this.inviteRepo.save(invite);
  }

  async remove(id: string): Promise<boolean> {
    const invite = await this.inviteRepo.findOne({ where: { id } });
    if (!invite) return false;
    await this.inviteRepo.remove(invite);
    return true;
  }

  // --- Private helpers ---

  private generateToken(): string {
    // 256-bit cryptographically secure token (hex-encoded)
    return crypto.randomBytes(32).toString('hex');
  }
}
