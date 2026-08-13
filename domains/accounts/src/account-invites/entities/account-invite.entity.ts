import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import { ulid } from 'ulid';
import { Account } from '../../accounts/entities/account.entity';

@Entity('account_invites')
@Index(['accountId', 'email'])
export class AccountInvite {
  // --- PK: ULID ---

  @PrimaryColumn({ type: 'varchar', length: 26 })
  id!: string;

  // --- Relationship (account is owned by this service; user is cross-service) ---

  @Column({ type: 'varchar', length: 26, name: 'account_id' })
  accountId!: string;

  @ManyToOne(() => Account, { eager: false })
  @JoinColumn({ name: 'account_id' })
  account?: Account;

  // Invitation is always bound to an email (Rule 6)
  @Column({ type: 'text', name: 'email' })
  email!: string;

  // --- Secure invitation token (unique, never logged) ---

  @Index({ unique: true })
  @Column({ type: 'text', name: 'token' })
  token!: string;

  // Proposed roles assigned when the invite is accepted
  @Column({ type: 'jsonb', name: 'role_ids', default: () => "'[]'" })
  roleIds!: string[];

  // --- Lifecycle (VARCHAR + CHECK — NOT native Postgres ENUM, Critical Rule #9) ---

  @Column({
    type: 'varchar',
    length: 15,
    name: 'status',
    default: 'pending',
  })
  status!: 'pending' | 'accepted' | 'revoked' | 'declined';

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', name: 'accepted_at', nullable: true })
  acceptedAt!: Date | null;

  @Column({ type: 'timestamptz', name: 'revoked_at', nullable: true })
  revokedAt!: Date | null;

  // Initiator is always an Account owner/admin (Rule 5); user id is cross-service
  @Column({ type: 'varchar', length: 26, name: 'created_by' })
  createdBy!: string;

  // --- Audit ---

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' })
  deletedAt!: Date | null;

  // --- Lifecycle ---

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = ulid();
    }
  }
}
