import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  Index,
} from 'typeorm';
import { ulid } from 'ulid';
import { User } from '../../users/entities/user.entity';

@Entity('auth_identities')
@Index(['providerType', 'providerSubject'], { unique: true })
export class AuthIdentity {
  // --- PK: ULID ---

  @PrimaryColumn({ type: 'varchar', length: 26 })
  id!: string;

  // --- Relationship ---

  @Column({ type: 'varchar', length: 26, name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  // --- Provider ---

  // VARCHAR + CHECK — NOT native Postgres ENUM (Critical Rule #9)

  @Column({
    type: 'varchar',
    length: 20,
    name: 'provider_type',
  })
  providerType!:
    'email_password' | 'phone_password' | 'phone_otp' | 'google' | 'apple';

  @Column({ type: 'text', name: 'provider_subject' })
  providerSubject!: string;

  // --- Contact (denormalized from user for fast lookups) ---

  @Column({ type: 'text', name: 'email_normalized', nullable: true })
  emailNormalized!: string | null;

  @Column({ type: 'text', name: 'phone_e164', nullable: true })
  phoneE164!: string | null;

  // --- Flags ---

  @Column({ type: 'boolean', name: 'is_primary', default: false })
  isPrimary!: boolean;

  @Column({ type: 'boolean', name: 'is_verified', default: false })
  isVerified!: boolean;

  // --- Verification ---

  @Column({ type: 'timestamptz', name: 'verified_at', nullable: true })
  verifiedAt!: Date | null;

  // --- Credentials ---

  @Column({ type: 'text', name: 'credential_hash', nullable: true })
  credentialHash!: string | null;

  // --- OAuth / Extension ---

  @Column({ type: 'jsonb', name: 'metadata', nullable: true })
  metadata!: Record<string, unknown> | null;

  // --- Activity ---

  @Column({ type: 'timestamptz', name: 'last_used_at', nullable: true })
  lastUsedAt!: Date | null;

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
