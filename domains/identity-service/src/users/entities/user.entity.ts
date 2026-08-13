import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { ulid } from 'ulid';

@Entity('users')
export class User {
  // --- PK: ULID (generated before insert) ---

  @PrimaryColumn({ type: 'varchar', length: 26 })
  id!: string;

  // --- Profile ---

  @Column({ type: 'text', name: 'first_name' })
  firstName!: string;

  @Column({ type: 'text', name: 'last_name' })
  lastName!: string;

  @Column({ type: 'text', name: 'display_name' })
  displayName!: string;

  @Column({ type: 'text', name: 'email', unique: true, nullable: true })
  email!: string | null;

  // Phone: local number without leading 0 or country code (e.g. '9123456789')

  @Column({ type: 'text', name: 'phone_number', nullable: true })
  phoneNumber!: string | null;

  // Country dial code without '+' prefix (e.g. '98' for Iran)

  @Column({
    type: 'varchar',
    length: 5,
    name: 'phone_country_code',
    nullable: true,
  })
  phoneCountryCode!: string | null;

  @Column({ type: 'text', name: 'avatar_url', nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'date', name: 'birth_date', nullable: true })
  birthDate!: string | null;

  // --- Localization ---

  // preferred_language removed — locale already serves this purpose

  @Column({ type: 'varchar', length: 10, name: 'locale', default: 'fa-IR' })
  locale!: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'timezone',
    default: 'Asia/Tehran',
  })
  timezone!: string;

  // VARCHAR + CHECK at DB level — NOT native Postgres ENUM (Critical Rule #9)

  @Column({
    type: 'varchar',
    length: 10,
    name: 'calendar_preference',
    default: 'jalali',
  })
  calendarPreference!: 'jalali' | 'gregorian';

  @Column({
    type: 'varchar',
    length: 10,
    name: 'status',
    default: 'pending',
  })
  status!: 'active' | 'blocked' | 'pending' | 'deleted';

  // --- Profile completion ---

  @Column({ type: 'timestamptz', name: 'profile_completed_at', nullable: true })
  profileCompletedAt!: Date | null;

  // --- Auth / Activity ---

  @Column({ type: 'timestamptz', name: 'last_login_at', nullable: true })
  lastLoginAt!: Date | null;

  // --- Audit ---

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' })
  deletedAt!: Date | null;

  // --- Lifecycle hooks ---

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = ulid();
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail() {
    if (this.email) {
      this.email = this.email.trim().toLowerCase();
    }
  }
}
