import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { ulid } from 'ulid';
import type { AccessRole } from '../../common/enums';

/**
 * Shares a farm with another user at a role level. All user IDs are external
 * references to the identity-service (no cross-service DB FK).
 *
 * "Active" is DERIVED (revoked_at IS NULL AND (expires_at IS NULL OR
 * expires_at > now())), never stored.
 */
@Entity('farm_access_grants')
export class FarmAccessGrant {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id!: string;

  @Column({ type: 'varchar', length: 26, name: 'farm_id' })
  farmId!: string;

  // External reference (identity-service) — no DB FK.
  @Column({ type: 'varchar', length: 26, name: 'grantee_user_id' })
  granteeUserId!: string;

  @Column({ type: 'varchar', length: 20, name: 'access_role' })
  accessRole!: AccessRole;

  // External reference (identity-service) — no DB FK.
  @Column({ type: 'varchar', length: 26, name: 'granted_by_user_id' })
  grantedByUserId!: string;

  @Column({ type: 'timestamptz', name: 'granted_at', default: () => 'now()' })
  grantedAt!: Date;

  @Column({ type: 'timestamptz', name: 'expires_at', nullable: true })
  expiresAt!: Date | null;

  @Column({ type: 'timestamptz', name: 'revoked_at', nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @BeforeInsert()
  generateId(): void {
    if (!this.id) this.id = ulid();
  }
}
