import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { Public } from '../common/auth/public.decorator';
import { OnboardingService } from './onboarding.service';

@Controller('internal/onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  // Owner-account provisioning moved to the RabbitMQ consumer
  // (events/onboarding-events.consumer.ts) fed by identity-service's
  // transactional outbox — cross-service writes are never synchronous HTTP
  // (Critical Rules #2/#3). The read endpoints below remain sync by design.

  @Get('users/:userId/has-active-account')
  @Public()
  async hasActiveAccount(
    @Param('userId') userId: string,
    @Headers('x-internal-service-key') serviceKey?: string,
  ) {
    const expected = process.env.INTERNAL_SERVICE_API_KEY;
    if (!expected || serviceKey !== expected) {
      throw new UnauthorizedException('Invalid internal service credentials.');
    }
    return {
      hasActiveAccount: await this.onboardingService.hasActiveAccount(userId),
    };
  }

  /**
   * Internal: resolves the user's current active account id so the api-gateway
   * can forward `x-account-id` (ADR-001 composite claim). Returns
   * `{ accountId: null }` when the user has no active membership.
   */
  @Get('users/:userId/active-account')
  @Public()
  async getActiveAccount(
    @Param('userId') userId: string,
    @Headers('x-internal-service-key') serviceKey?: string,
  ): Promise<{ accountId: string | null }> {
    const expected = process.env.INTERNAL_SERVICE_API_KEY;
    if (!expected || serviceKey !== expected) {
      throw new UnauthorizedException('Invalid internal service credentials.');
    }
    return {
      accountId: await this.onboardingService.getActiveAccountId(userId),
    };
  }
}
