import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BeforeInsert,
} from 'typeorm';
import { ulid } from 'ulid';

@Entity('accounts')
export class Account {
  // --- PK: ULID ---

  @PrimaryColumn({ type: 'varchar', length: 26 })
  id!: string;

  // --- Tenant identity ---

  // VARCHAR + CHECK — NOT native Postgres ENUM (Critical Rule #9)

  @Column({
    type: 'varchar',
    length: 20,
    name: 'account_type',
    default: 'individual',
  })
  accountType!: 'individual' | 'organization';

  @Column({
    type: 'varchar',
    length: 25,
    name: 'status',
    default: 'pending',
  })
  status!: 'pending' | 'active' | 'archived';

  @Column({ type: 'text', name: 'display_name' })
  displayName!: string;

  // --- Locale defaults (Iran primary market) ---

  @Column({ type: 'char', length: 2, name: 'country_code', default: 'IR' })
  countryCode!: string;

  @Column({ type: 'varchar', length: 10, name: 'locale', default: 'fa-IR' })
  locale!: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'timezone',
    default: 'Asia/Tehran',
  })
  timezone!: string;

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
    name: 'measurement_system',
    default: 'metric',
  })
  measurementSystem!: 'metric' | 'imperial';

  // --- Billing ---

  @Column({
    type: 'char',
    length: 3,
    name: 'default_currency_code',
    default: 'IRT',
  })
  defaultCurrencyCode!: string;

  // --- Infrastructure ---

  @Column({ type: 'varchar', length: 30, name: 'data_region' })
  dataRegion!: string;

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
