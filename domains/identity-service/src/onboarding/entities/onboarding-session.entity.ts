import { BeforeInsert, Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import { ulid } from 'ulid';

@Entity('onboarding_sessions')
export class OnboardingSession {
  @PrimaryColumn({ type: 'varchar', length: 26 }) id!: string;
  @Column({ type: 'varchar', length: 26, name: 'user_id' }) userId!: string;
  @Column({ type: 'varchar', length: 64, unique: true, name: 'token_hash' }) tokenHash!: string;
  @Column({ type: 'varchar', length: 30, default: 'account_required' })
  status!: 'account_required' | 'verification_pending' | 'completed';
  @Column({ type: 'varchar', length: 10, name: 'verification_channel', nullable: true })
  verificationChannel!: 'email' | 'phone' | null;
  @Column({ type: 'timestamptz', name: 'expires_at' }) expiresAt!: Date;
  @Column({ type: 'timestamptz', name: 'completed_at', nullable: true }) completedAt!: Date | null;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
  @BeforeInsert() generateId() { if (!this.id) this.id = ulid(); }
}
