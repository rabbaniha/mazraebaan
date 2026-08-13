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

@Entity('otp_verifications')
@Index(['userId', 'purpose'], { unique: true })
export class OtpVerification {
  // --- PK: ULID ---

  @PrimaryColumn({ type: 'varchar', length: 26 })
  id!: string;

  // --- Relationship ---

  @Column({ type: 'varchar', length: 26, name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  // --- OTP data ---

  // Hashed 6-digit code — raw code is NEVER stored
  @Column({ type: 'text', name: 'code_hash' })
  codeHash!: string;

  // VARCHAR + CHECK — NOT native Postgres ENUM (Critical Rule #9)
  @Column({
    type: 'varchar',
    length: 30,
    name: 'purpose',
  })
  purpose!:
    | 'register_email'
    | 'register_phone'
    | 'login_email'
    | 'login_phone'
    | 'verify_change';

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt!: Date;

  @Column({ type: 'integer', name: 'max_attempts', default: 5 })
  maxAttempts!: number;

  @Column({ type: 'integer', name: 'attempt_count', default: 0 })
  attemptCount!: number;

  @Column({ type: 'timestamptz', name: 'verified_at', nullable: true })
  verifiedAt!: Date | null;

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
