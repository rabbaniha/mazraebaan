import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { OnboardingService } from '../onboarding/onboarding.service';
import { ProvisionOwnerAccountDto } from '../onboarding/dto/provision-owner-account.dto';

/**
 * Consumes `account.provisioning.requested` events produced by
 * identity-service's transactional outbox. The handler is idempotent:
 * provisionOwnerAccount short-circuits when a membership already exists
 * (at-least-once delivery from the relay).
 */
@Controller()
export class OnboardingEventsConsumer {
  private readonly logger = new Logger(OnboardingEventsConsumer.name);

  constructor(private readonly onboardingService: OnboardingService) {}

  @EventPattern('account.provisioning.requested')
  async onAccountProvisioningRequested(
    @Payload() dto: ProvisionOwnerAccountDto,
  ) {
    try {
      const result = await this.onboardingService.provisionOwnerAccount(dto);
      this.logger.log(
        `Owner account provisioning ${result.alreadyProvisioned ? 'skipped (already provisioned)' : 'completed'} for user ${dto.userId}`,
      );
      return result;
    } catch (err) {
      this.logger.error(
        `Owner account provisioning failed for user ${dto.userId}: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw err; // nack → broker requeues; provisioning retries
    }
  }
}
