import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Account } from '../accounts/entities/account.entity';
import { AccountMember } from '../account-members/entities/account-member.entity';
import { AccountMemberRole } from '../account-members/entities/account-member-role.entity';
import { Role } from '../roles/entities/role.entity';
import { ProvisionOwnerAccountDto } from './dto/provision-owner-account.dto';

/** Creates the tenant and its immutable initial owner atomically. */
@Injectable()
export class OnboardingService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async provisionOwnerAccount(dto: ProvisionOwnerAccountDto) {
    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.getRepository(AccountMember).findOne({
        where: { userId: dto.userId },
        relations: { account: true },
      });
      if (existing?.account) {
        return {
          account: existing.account,
          membership: existing,
          alreadyProvisioned: true,
        };
      }

      let ownerRole = await manager
        .getRepository(Role)
        .findOne({ where: { name: 'owner' } });
      if (!ownerRole) {
        ownerRole = await manager.getRepository(Role).save(
          manager.getRepository(Role).create({
            name: 'owner',
            isSystem: true,
            description: 'Full control of an account',
          }),
        );
      }

      const account = await manager.getRepository(Account).save(
        manager.getRepository(Account).create({
          ...dto.account,
          accountType: dto.account.accountType ?? 'individual',
          status: 'active',
        }),
      );
      const membership = await manager.getRepository(AccountMember).save(
        manager.getRepository(AccountMember).create({
          accountId: account.id,
          userId: dto.userId,
          status: 'active',
          invitedAt: new Date(),
          joinedAt: new Date(),
          invitedBy: null,
        }),
      );
      await manager.getRepository(AccountMemberRole).save(
        manager.getRepository(AccountMemberRole).create({
          accountMemberId: membership.id,
          roleId: ownerRole.id,
        }),
      );
      return { account, membership, alreadyProvisioned: false };
    });
  }

  async hasActiveAccount(userId: string): Promise<boolean> {
    return (
      (await this.dataSource.getRepository(AccountMember).count({
        where: { userId, status: 'active' },
      })) > 0
    );
  }

  /**
   * Resolves the user's current active account id (or null). Used by the
   * api-gateway to composite the ADR-001 `account_id` claim into forwarded
   * requests (`x-account-id`). Deterministic: earliest-joined active
   * membership wins. Membership uniqueness is per (account_id, user_id), so a
   * user may belong to several accounts over time.
   */
  async getActiveAccountId(userId: string): Promise<string | null> {
    const membership = await this.dataSource
      .getRepository(AccountMember)
      .findOne({
        where: { userId, status: 'active' },
        order: { joinedAt: 'ASC', invitedAt: 'ASC' },
      });
    return membership?.accountId ?? null;
  }
}
