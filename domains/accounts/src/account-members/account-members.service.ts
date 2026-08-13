import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountMember } from './entities/account-member.entity';
import { AccountMemberRole } from './entities/account-member-role.entity';
import { CreateAccountMemberDto } from './dto/create-account-member.dto';
import { UpdateAccountMemberDto } from './dto/update-account-member.dto';

@Injectable()
export class AccountMembersService {
  constructor(
    @InjectRepository(AccountMember)
    private readonly memberRepo: Repository<AccountMember>,
    @InjectRepository(AccountMemberRole)
    private readonly memberRoleRepo: Repository<AccountMemberRole>,
  ) {}

  /**
   * Create an account membership with optional role assignments.
   *
   * New memberships are always created with status 'invited' (Rule 3).
   * They are NOT created by users requesting to join (Rule 4) — only as a
   * consequence of an invitation being accepted (see AccountInvitesService.accept).
   * The join (status → 'active') happens later, on first authenticated access.
   */
  async create(dto: CreateAccountMemberDto): Promise<AccountMember> {
    // Enforce unique (accountId, userId)
    const existing = await this.memberRepo.findOne({
      where: { accountId: dto.accountId, userId: dto.userId },
    });
    if (existing) {
      throw new ConflictException('User is already a member of this account');
    }

    const member = this.memberRepo.create({
      accountId: dto.accountId,
      userId: dto.userId,
      status: 'invited',
      invitedAt: new Date(dto.invitedAt),
      invitedBy: dto.invitedBy ?? null,
    });
    const saved = await this.memberRepo.save(member);

    // Assign roles if provided
    if (dto.roleIds?.length) {
      const assignments = dto.roleIds.map((roleId) =>
        this.memberRoleRepo.create({
          accountMemberId: saved.id,
          roleId,
        }),
      );
      await this.memberRoleRepo.save(assignments);
    }

    return saved;
  }

  async findAll(): Promise<AccountMember[]> {
    return this.memberRepo.find();
  }

  async findOne(id: string): Promise<AccountMember | null> {
    return this.memberRepo.findOne({ where: { id } });
  }

  /**
   * Find all memberships for a user (across accounts).
   */
  async findByUserId(userId: string): Promise<AccountMember[]> {
    return this.memberRepo.find({ where: { userId } });
  }

  /**
   * Find all members of an account.
   */
  async findByAccountId(accountId: string): Promise<AccountMember[]> {
    return this.memberRepo.find({ where: { accountId } });
  }

  /**
   * Find a user's active/invited memberships (excludes removed/declined).
   * Used by the /me context (accounts-service) — identity never reads this.
   */
  async findInvitedOrActiveForUser(userId: string): Promise<AccountMember[]> {
    return this.memberRepo.find({
      where: [
        { userId, status: 'invited' },
        { userId, status: 'active' },
      ],
    });
  }

  /**
   * Resolve the role ULIDs attached to a membership (for ownership checks).
   */
  async getRoleIdsForMembership(membershipId: string): Promise<string[]> {
    const rows = await this.memberRoleRepo.find({
      where: { accountMemberId: membershipId },
    });
    return rows.map((r) => r.roleId);
  }

  /**
   * Activate a membership (invited → active). Called on first authenticated access.
   */
  async activate(id: string): Promise<AccountMember> {
    const member = await this.memberRepo.findOne({ where: { id } });
    if (!member) {
      throw new NotFoundException('Membership not found');
    }
    if (member.status !== 'invited') {
      throw new ConflictException('Only invited memberships can be activated');
    }
    member.status = 'active';
    member.joinedAt = new Date();
    return this.memberRepo.save(member);
  }

  /**
   * Remove a membership (explicit lifecycle state, not a hard delete).
   */
  async removeMember(id: string, removedBy: string): Promise<AccountMember> {
    const member = await this.memberRepo.findOne({ where: { id } });
    if (!member) {
      throw new NotFoundException('Membership not found');
    }
    member.status = 'removed';
    member.removedBy = removedBy;
    member.removedAt = new Date();
    return this.memberRepo.save(member);
  }

  async update(
    id: string,
    dto: UpdateAccountMemberDto,
  ): Promise<AccountMember | null> {
    const member = await this.memberRepo.findOne({ where: { id } });
    if (!member) return null;
    Object.assign(member, dto);
    return this.memberRepo.save(member);
  }

  async remove(id: string): Promise<boolean> {
    const member = await this.memberRepo.findOne({ where: { id } });
    if (!member) return false;
    // Cascade deletes account_member_roles via DB FK
    await this.memberRepo.remove(member);
    return true;
  }
}
