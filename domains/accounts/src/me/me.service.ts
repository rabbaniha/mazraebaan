import { Injectable } from '@nestjs/common';
import { AccountMembersService } from '../account-members/account-members.service';
import { RolesService } from '../roles/roles.service';

export interface UserAccountContext {
  userId: string;
  accountIds: string[];
  ownedAccountId: string | null;
  memberships: {
    id: string;
    accountId: string;
    status: string;
    invitedAt: Date;
    joinedAt: Date | null;
  }[];
  requiresAccount: boolean;
}

/**
 * Read-only projection of an authenticated user's account state.
 *
 * Lives in accounts-service (the owner of membership data). identity-service
 * never reads accounts; the frontend asks here after login.
 *
 * The backend NEVER redirects — it only returns state (Step 6).
 */
@Injectable()
export class MeService {
  constructor(
    private readonly accountMembersService: AccountMembersService,
    private readonly rolesService: RolesService,
  ) {}

  async getUserContext(userId: string): Promise<UserAccountContext> {
    const memberships =
      await this.accountMembersService.findInvitedOrActiveForUser(userId);

    const accountIds = [...new Set(memberships.map((m) => m.accountId))];

    // ownedAccountId: the account where this user holds the 'owner' role.
    // Rule 1 — users may own multiple accounts; we surface the first one (nullable).
    let ownedAccountId: string | null = null;
    for (const m of memberships) {
      const roleIds = await this.accountMembersService.getRoleIdsForMembership(
        m.id,
      );
      if (roleIds.length === 0) continue;
      const roles = await this.rolesService.findByIds(roleIds);
      if (roles.some((r) => r.name === 'owner')) {
        ownedAccountId = m.accountId;
        break;
      }
    }

    // requiresAccount: user owns no account AND belongs to no account.
    const requiresAccount = accountIds.length === 0;

    return {
      userId,
      accountIds,
      ownedAccountId,
      memberships: memberships.map((m) => ({
        id: m.id,
        accountId: m.accountId,
        status: m.status,
        invitedAt: m.invitedAt,
        joinedAt: m.joinedAt,
      })),
      requiresAccount,
    };
  }
}
