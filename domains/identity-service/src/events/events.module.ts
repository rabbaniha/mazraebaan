import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxMessage } from './entities/outbox-message.entity';
import { AmqpPublisherService } from './amqp-publisher.service';
import { OutboxService } from './outbox.service';
import { OutboxRelayService } from './outbox-relay.service';

/**
 * Transactional outbox infrastructure shared by all identity flows that
 * publish cross-service events (Critical Rule #3).
 */
@Module({
  imports: [TypeOrmModule.forFeature([OutboxMessage])],
  providers: [AmqpPublisherService, OutboxService, OutboxRelayService],
  exports: [OutboxService],
})
export class EventsModule {}
