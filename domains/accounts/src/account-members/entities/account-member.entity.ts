import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  BeforeInsert,
  Index,
} from 'typeorm';
import { ulid } from 'ulid';
import { Account } from '../../accounts/entities/account.entity';
import { AccountMemberRole } from './account-member-role.entity';

@Entity('account_members')
@Index(['accountId', 'userId'], { unique: true })
export class AccountMember {
  // --- PK: ULID ---

  @PrimaryColumn({ type: 'varchar', length: 26 })
  id!: string;

  // --- Relationships ---

  @Column({ type: 'varchar', length: 26, name: 'account_id' })
  accountId!: string;

  @ManyToOne(() => Account, { eager: false })
  @JoinColumn({ name: 'account_id' })
  account?: Account;

  // user_id is a cross-service ULID reference to identity-service (no DB FK).
  // The User entity lives in identity-service, not here.
  @Column({ type: 'varchar', length: 26, name: 'user_id' })
  userId!: string;

  // --- Membership lifecycle (explicit states — no boolean flags) ---

  // VARCHAR + CHECK — NOT native Postgres ENUM (Critical Rule #9)
  @Column({
    type: 'varchar',
    length: 20,
    name: 'status',
    default: 'invited',
  })
  status!: 'invited' | 'active' | 'removed' | 'declined';

  @Column({ type: 'timestamptz', name: 'invited_at' })
  invitedAt!: Date;

  @Column({ type: 'timestamptz', name: 'joined_at', nullable: true })
  joinedAt!: Date | null;

  @Column({ type: 'timestamptz', name: 'last_active_at', nullable: true })
  lastActiveAt!: Date | null;

  // --- Inviter / Remover (cross-service user references — no FK) ---

  @Column({ type: 'varchar', length: 26, name: 'invited_by', nullable: true })
  invitedBy!: string | null;

  @Column({ type: 'varchar', length: 26, name: 'removed_by', nullable: true })
  removedBy!: string | null;

  @Column({ type: 'timestamptz', name: 'removed_at', nullable: true })
  removedAt!: Date | null;

  // --- RBAC (many-to-many via junction entity) ---

  @OneToMany(() => AccountMemberRole, (amr) => amr.accountMember)
  memberRoles?: AccountMemberRole[];

  // --- Audit ---

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  // --- Lifecycle ---

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = ulid();
    }
  }
}
