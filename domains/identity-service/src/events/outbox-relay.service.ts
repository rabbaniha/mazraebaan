import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { OutboxService } from './outbox.service';

const RELAY_INTERVAL_MS = 750;

/**
 * Background relay: periodically publishes pending outbox rows to RabbitMQ.
 * Runs in-process with the API — a crash between business write and publish
 * loses nothing, because the row is already committed and retried here.
 */
@Injectable()
export class OutboxRelayService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(OutboxRelayService.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(private readonly outbox: OutboxService) {}

  onApplicationBootstrap() {
    this.timer = setInterval(() => void this.tick(), RELAY_INTERVAL_MS);
  }

  onApplicationShutdown() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      await this.outbox.publishPending();
    } catch (err) {
      this.logger.warn(
        `Outbox relay tick failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      this.running = false;
    }
  }
}
