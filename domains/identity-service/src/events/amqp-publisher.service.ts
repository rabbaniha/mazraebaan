import { Injectable, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';

/**
 * Thin RabbitMQ publisher for the outbox relay.
 *
 * Maintains a lazily-created connection + topic exchange. Publish failures do
 * NOT throw into business code — the relay simply leaves the row pending and
 * retries on the next tick (at-least-once semantics).
 */
@Injectable()
export class AmqpPublisherService {
  private readonly logger = new Logger(AmqpPublisherService.name);
  private readonly exchange = 'mazraebaan.events';
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;
  private connecting: Promise<void> | null = null;

  async publish(routingKey: string, payload: Record<string, unknown>) {
    const channel = await this.getChannel();
    // @nestjs/microservices RMQ consumers route on the `{ pattern, data }`
    // envelope in the message body — keep this wire format in sync with
    // accounts-service (see events/onboarding-events.consumer.ts).
    const body = JSON.stringify({ pattern: routingKey, data: payload });
    channel.publish(this.exchange, routingKey, Buffer.from(body), {
      persistent: true,
      contentType: 'application/json',
      messageId: routingKey,
      timestamp: Date.now(),
    });
  }

  private async getChannel(): Promise<amqp.Channel> {
    if (this.channel) return this.channel;
    if (!this.connecting) {
      this.connecting = this.connect().finally(() => {
        this.connecting = null;
      });
    }
    await this.connecting;
    if (!this.channel) throw new Error('AMQP channel unavailable');
    return this.channel;
  }

  private async connect(): Promise<void> {
    const url =
      process.env.RABBITMQ_URL ??
      'amqp://mazraebaan:mazraebaan_dev_pass@localhost:5672';
    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(this.exchange, 'topic', {
        durable: true,
      });
      this.connection.on('close', () => this.reset());
      this.connection.on('error', () => this.reset());
    } catch (err) {
      this.reset();
      throw err instanceof Error ? err : new Error(String(err));
    }
  }

  /** Drop the cached connection/channel so the next publish reconnects. */
  reset() {
    this.channel = null;
    this.connection = null;
  }

  logConnectionError(err: unknown) {
    this.logger.warn(
      `RabbitMQ publish failed; will retry: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
