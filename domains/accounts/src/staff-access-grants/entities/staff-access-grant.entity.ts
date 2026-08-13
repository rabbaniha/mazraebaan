import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { ulid } from 'ulid';
import { Account } from '../../accounts/entities/account.entity';

@Entity('staff_access_grants')
export class StaffAccessGrant {
  // --- PK: ULID ---

  @PrimaryColumn({ type: 'varchar', length: 26 })
  id!: string;

  // --- Staff member (cross-service user reference — no FK) ---

  @Column({ type: 'varchar', length: 26, name: 'staff_user_id' })
  staffUserId!: string;

  // --- Scope targets (polymorphic — at most one should be set) ---

  @Column({ type: 'varchar', length: 26, name: 'account_id', nullable: true })
  accountId!: string | null;

  @ManyToOne(() => Account, { eager: false, nullable: true })
  @JoinColumn({ name: 'account_id' })
  account?: Account;

  // Not a DB FK — farms live in farms_db, this is a cross-service ULID reference

  @Column({ type: 'varchar', length: 26, name: 'farm_id', nullable: true })
  farmId!: string | null;

  // --- Access classification ---

  // VARCHAR + CHECK — NOT native Postgres ENUM (Critical Rule #9)

  @Column({
    type: 'varchar',
    length: 15,
    name: 'access_scope',
  })
  accessScope!: 'system' | 'account' | 'farm';

  @Column({
    type: 'varchar',
    length: 15,
    name: 'access_level',
  })
  accessLevel!: 'support' | 'agronomist' | 'admin';

  // --- Authorization ---

  @Column({ type: 'varchar', length: 26, name: 'granted_by_user_id' })
  grantedByUserId!: string;

  // --- Audit reason ---

  @Column({ type: 'text', name: 'reason' })
  reason!: string;

  // --- Time window ---

  @Column({ type: 'timestamptz', name: 'starts_at' })
  startsAt!: Date;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', name: 'revoked_at', nullable: true })
  revokedAt!: Date | null;

  // --- Audit ---

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  // --- Lifecycle ---

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = ulid();
    }
  }
}
