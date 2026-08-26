import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { ulid } from 'ulid';
import { OutboxMessage } from './entities/outbox-message.entity';
import { AmqpPublisherService } from './amqp-publisher.service';

export interface EnqueueOutboxMessage {
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
}

/**
 * Transactional outbox (Critical Rule #3).
 *
 * `enqueue` MUST be called with the transactional EntityManager of the business
 * write so the event row commits atomically with the business change. The relay
 * publishes pending rows to RabbitMQ and marks them published.
 */
@Injectable()
export class OutboxService {
  constructor(
    @InjectRepository(OutboxMessage)
    private readonly repo: Repository<OutboxMessage>,
    @Inject(AmqpPublisherService)
    private readonly publisher: AmqpPublisherService,
  ) {}

  /** Insert an outbox row inside the caller's transaction. */
  async enqueue(
    manager: EntityManager,
    message: EnqueueOutboxMessage,
  ): Promise<OutboxMessage> {
    const row = manager.getRepository(OutboxMessage).create({
      id: ulid(),
      status: 'pending',
      publishedAt: null,
      ...message,
    });
    return manager.getRepository(OutboxMessage).save(row);
  }

  /**
   * Relay tick: publish pending rows (oldest first) to RabbitMQ.
   * Rows whose publish fails stay pending and are retried next tick.
   * Returns the number of rows published successfully.
   */
  async publishPending(limit = 50): Promise<number> {
    const pending = await this.repo.find({
      where: { status: 'pending' },
      order: { createdAt: 'ASC' },
      take: limit,
    });
    if (pending.length === 0) return 0;

    const publishedIds: string[] = [];
    for (const row of pending) {
      try {
        await this.publisher.publish(row.eventType, row.payload);
        publishedIds.push(row.id);
      } catch (err) {
        this.publisher.logConnectionError(err);
        break; // broker unavailable — retry everything next tick, in order
      }
    }
    if (publishedIds.length === 0) return 0;

    await this.repo.update(
      { id: In(publishedIds) },
      { status: 'published', publishedAt: new Date() },
    );
    return publishedIds.length;
  }
}
