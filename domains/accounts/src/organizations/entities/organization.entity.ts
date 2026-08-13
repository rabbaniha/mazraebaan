import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { ulid } from 'ulid';
import { Account } from '../../accounts/entities/account.entity';

@Entity('organizations')
export class Organization {
  // --- PK: ULID ---

  @PrimaryColumn({ type: 'varchar', length: 26 })
  id!: string;

  // --- OneToOne with Account (account_id is UNIQUE) ---

  @Column({ type: 'varchar', length: 26, name: 'account_id', unique: true })
  accountId!: string;

  @OneToOne(() => Account, { eager: false })
  @JoinColumn({ name: 'account_id' })
  account?: Account;

  // --- Legal / Business ---

  @Column({ type: 'text', name: 'legal_name' })
  legalName!: string;

  @Column({ type: 'text', name: 'brand_name', nullable: true })
  brandName!: string | null;

  @Column({ type: 'text', name: 'registration_number', nullable: true })
  registrationNumber!: string | null;

  @Column({ type: 'text', name: 'tax_identifier', nullable: true })
  taxIdentifier!: string | null;

  // --- Billing ---

  @Column({ type: 'text', name: 'billing_email', nullable: true })
  billingEmail!: string | null;

  @Column({ type: 'text', name: 'billing_phone', nullable: true })
  billingPhone!: string | null;

  // --- Classification ---

  // VARCHAR + CHECK — NOT native Postgres ENUM (Critical Rule #9)

  @Column({
    type: 'varchar',
    length: 15,
    name: 'size_category',
  })
  sizeCategory!: 'solo' | 'small' | 'medium' | 'enterprise';

  // --- Audit ---

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  // No deleted_at — organizations are not soft-deleted per schema

  // --- Lifecycle ---

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = ulid();
    }
  }
}
