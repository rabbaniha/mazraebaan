import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { ulid } from 'ulid';
import { User } from '../../users/entities/user.entity';

@Entity('user_devices')
export class UserDevice {
  // --- PK: ULID ---

  @PrimaryColumn({ type: 'varchar', length: 26 })
  id!: string;

  // --- Relationship ---

  @Column({ type: 'varchar', length: 26, name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  // --- Device Identity ---

  // VARCHAR + CHECK — NOT native Postgres ENUM (Critical Rule #9)

  @Column({
    type: 'varchar',
    length: 10,
    name: 'device_type',
  })
  deviceType!: 'web' | 'android' | 'ios' | 'desktop';

  @Column({ type: 'text', name: 'device_name' })
  deviceName!: string;

  @Column({ type: 'text', name: 'os_name' })
  osName!: string;

  @Column({ type: 'text', name: 'app_version', nullable: true })
  appVersion!: string | null;

  @Column({ type: 'text', name: 'push_token', nullable: true })
  pushToken!: string | null;

  // INET type — stored as string by TypeORM, Postgres handles the format

  @Column({ type: 'inet', name: 'ip_address' })
  ipAddress!: string;

  // --- Browser / Hardware ---

  @Column({ type: 'text', name: 'fingerprint' })
  fingerprint!: string;

  @Column({ type: 'text', name: 'browser', nullable: true })
  browser!: string | null;

  @Column({ type: 'text', name: 'platform', nullable: true })
  platform!: string | null;

  // --- Flags ---

  @Column({ type: 'boolean', name: 'is_trusted', default: false })
  isTrusted!: boolean;

  // --- Activity ---

  @Column({ type: 'timestamptz', name: 'last_seen_at' })
  lastSeenAt!: Date;

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
