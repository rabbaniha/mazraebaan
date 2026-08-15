import { BadGatewayException, Injectable } from '@nestjs/common';
import { CreateAccountDto } from './dto/create-own-account.dto';

@Injectable()
export class AccountsOnboardingClient {
  async provisionOwnerAccount(userId: string, account: CreateAccountDto) {
    const baseUrl = process.env.ACCOUNTS_SERVICE_URL ?? 'http://localhost:4002';
    const key = process.env.INTERNAL_SERVICE_API_KEY;
    if (!key)
      throw new BadGatewayException(
        'Internal onboarding service is not configured.',
      );
    const response = await fetch(
      `${baseUrl.replace(/\/+$/, '')}/internal/onboarding/owner-account`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-internal-service-key': key,
        },
        body: JSON.stringify({ userId, account }),
      },
    );
    if (!response.ok)
      throw new BadGatewayException('Could not provision the owner account.');
    return response.json() as Promise<{
      account: { id: string };
      membership: { id: string };
    }>;
  }

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
