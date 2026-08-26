import { BadGatewayException, Injectable } from '@nestjs/common';

/**
 * Synchronous reads against accounts-service (allowed by Critical Rule #2).
 * Cross-service WRITES go through RabbitMQ events via the outbox — see
 * auth.service.createOwnAccount.
 */
@Injectable()
export class AccountsOnboardingClient {
  async hasActiveAccount(userId: string): Promise<boolean> {
    const baseUrl = process.env.ACCOUNTS_SERVICE_URL ?? 'http://localhost:4002';
    const key = process.env.INTERNAL_SERVICE_API_KEY;
    if (!key)
      throw new BadGatewayException(
        'Internal onboarding service is not configured.',
      );
    const response = await fetch(
      `${baseUrl.replace(/\/+$/, '')}/internal/onboarding/users/${userId}/has-active-account`,
      {
        headers: { 'x-internal-service-key': key },
      },
    );
    if (!response.ok)
      throw new BadGatewayException('Could not validate account access.');
    return ((await response.json()) as { hasActiveAccount: boolean })
      .hasActiveAccount;
  }
}
