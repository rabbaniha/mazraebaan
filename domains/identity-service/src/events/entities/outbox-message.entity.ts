import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';
import { ulid } from 'ulid';

/**
 * Transactional outbox row (Critical Rule #3).
 *
 * Written in the SAME database transaction as the business write it belongs
 * to; a relay process publishes pending rows to RabbitMQ afterwards. At-least
 * once delivery — consumers must be idempotent.
 */
@Entity('outbox_messages')
export class OutboxMessage {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id!: string;

  /** Routing key used on the RabbitMQ topic exchange (e.g. account.created). */
  @Column({ type: 'varchar', length: 100, name: 'event_type' })
  eventType!: string;

  /** Domain concept the event is about (e.g. onboarding_session). */
  @Column({ type: 'varchar', length: 50, name: 'aggregate_type' })
  aggregateType!: string;

  /** ULID of the aggregate instance. */
  @Column({ type: 'varchar', length: 26, name: 'aggregate_id' })
  aggregateId!: string;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  /** VARCHAR + CHECK — NOT native Postgres ENUM (Critical Rule #9). */
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: 'pending' | 'published';

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', name: 'published_at', nullable: true })
  publishedAt!: Date | null;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = ulid();
  }
}
