import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Transactional outbox table (Critical Rule #3): event rows are committed in
 * the same transaction as the business write; a relay publishes them to
 * RabbitMQ and flips status to 'published'.
 */
export class CreateOutboxMessages1750000000003 implements MigrationInterface {
  name = 'CreateOutboxMessages1750000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE outbox_messages (
        id varchar(26) PRIMARY KEY,
        event_type varchar(100) NOT NULL,
        aggregate_type varchar(50) NOT NULL,
        aggregate_id varchar(26) NOT NULL,
        payload jsonb NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'pending',
        created_at timestamptz NOT NULL DEFAULT now(),
        published_at timestamptz,
        CONSTRAINT chk_outbox_messages_status CHECK (status IN ('pending','published'))
      );
    `);
    await queryRunner.query(
      `CREATE INDEX idx_outbox_messages_pending ON outbox_messages(created_at) WHERE status = 'pending';`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS outbox_messages;`);
  }
}
