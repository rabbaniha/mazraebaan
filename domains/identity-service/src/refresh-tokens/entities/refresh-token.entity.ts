import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  Index,
} from 'typeorm';
import { ulid } from 'ulid';
import { User } from '../../users/entities/user.entity';
import { UserDevice } from '../../user-devices/entities/user-device.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  // --- PK: ULID ---

  @PrimaryColumn({ type: 'varchar', length: 26 })
  id!: string;

  // --- Relationships ---

  @Column({ type: 'varchar', length: 26, name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'varchar', length: 26, name: 'device_id', nullable: true })
  deviceId!: string | null;

  @ManyToOne(() => UserDevice, { eager: false, nullable: true })
  @JoinColumn({ name: 'device_id' })
  device?: UserDevice;

  // --- Token ---

  // NEVER store raw tokens — only SHA-256 hash (Critical Rule: security)

  @Index({ unique: true })
  @Column({ type: 'text', name: 'token_hash' })
  tokenHash!: string;

  // --- Rotation tracking ---

  @Column({ type: 'varchar', length: 26, name: 'family_id' })
  familyId!: string;

  // --- Lifecycle ---

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', name: 'revoked_at', nullable: true })
  revokedAt!: Date | null;

  // Self-reference: points to the next token in the rotation family

  @Column({
    type: 'varchar',
    length: 26,
    name: 'replaced_by_token_id',
    nullable: true,
  })
  replacedByTokenId!: string | null;

  // --- Issuance context ---

  @Column({ type: 'inet', name: 'issued_ip' })
  issuedIp!: string;

  @Column({ type: 'text', name: 'issued_user_agent' })
  issuedUserAgent!: string;

  // --- Audit ---

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  // No updated_at — refresh tokens are write-once; revocation is a new row state

  // --- Lifecycle ---

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = ulid();
    }
  }
}
