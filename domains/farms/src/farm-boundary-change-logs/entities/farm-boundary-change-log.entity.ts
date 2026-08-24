import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { ulid } from 'ulid';
import type { BoundaryChangeType } from '../../common/enums';

/**
 * Append-only audit/history of boundary changes.
 *
 * This is a database table, NOT a RabbitMQ event — domain events still flow
 * through the Outbox (ADR-007). `old_boundary_id`/`new_boundary_id` are plain
 * ULID references (no FK) so the audit trail survives boundary purging.
 */
@Entity('farm_boundary_change_logs')
export class FarmBoundaryChangeLog {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id!: string;

  @Column({ type: 'varchar', length: 26, name: 'farm_id' })
  farmId!: string;

  @Column({ type: 'varchar', length: 26, name: 'old_boundary_id', nullable: true })
  oldBoundaryId!: string | null;

  @Column({ type: 'varchar', length: 26, name: 'new_boundary_id' })
  newBoundaryId!: string;

  // External reference (identity-service) — no DB FK.
  @Column({ type: 'varchar', length: 26, name: 'changed_by_user_id' })
  changedByUserId!: string;

  @Column({ type: 'varchar', length: 20, name: 'change_type' })
  changeType!: BoundaryChangeType;

  @Column({ type: 'text', name: 'reason' })
  reason!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @BeforeInsert()
  generateId(): void {
    if (!this.id) this.id = ulid();
  }
}
