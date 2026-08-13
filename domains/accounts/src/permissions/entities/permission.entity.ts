import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { ulid } from 'ulid';

@Entity('permissions')
export class Permission {
  // --- PK: ULID ---

  @PrimaryColumn({ type: 'varchar', length: 26 })
  id!: string;

  // --- Identity ---

  @Column({ type: 'varchar', length: 100, unique: true, name: 'name' })
  name!: string;

  @Column({ type: 'varchar', length: 50, name: 'resource' })
  resource!: string;

  @Column({ type: 'varchar', length: 50, name: 'action' })
  action!: string;

  @Column({ type: 'text', name: 'description', nullable: true })
  description!: string | null;

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
