import { Body, Controller, Get, Headers, Param, Post, UnauthorizedException } from '@nestjs/common';
import { Public } from '../common/auth/public.decorator';
import { ProvisionOwnerAccountDto } from './dto/provision-owner-account.dto';
import { OnboardingService } from './onboarding.service';

@Controller('internal/onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('owner-account')
  @Public()
  provisionOwnerAccount(
    @Body() dto: ProvisionOwnerAccountDto,
    @Headers('x-internal-service-key') serviceKey?: string,
  ) {
    const expected = process.env.INTERNAL_SERVICE_API_KEY;
    if (!expected || serviceKey !== expected) {
      throw new UnauthorizedException('Invalid internal service credentials.');
    }
    return this.onboardingService.provisionOwnerAccount(dto);
  }

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
    return { hasActiveAccount: await this.onboardingService.hasActiveAccount(userId) };
  }
}
