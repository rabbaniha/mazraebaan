import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // RabbitMQ consumer for cross-service events (Critical Rule #2/#3).
  // Queue is durable; the handler is idempotent, matching at-least-once
  // delivery of the producer's transactional outbox.
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [
        process.env.RABBITMQ_URL ??
          'amqp://mazraebaan:mazraebaan_dev_pass@localhost:5672',
      ],
      // Must match the producer side (identity-service AmqpPublisherService):
      // same durable topic exchange, same routing key as event_type.
      exchange: 'mazraebaan.events',
      routingKey: 'account.provisioning.requested',
      queue: 'accounts.onboarding',
      queueOptions: { durable: true },
      noAck: false,
    },
  });
  await app.startAllMicroservices();

  await app.listen(process.env.PORT ?? 4002);
}
void bootstrap();
