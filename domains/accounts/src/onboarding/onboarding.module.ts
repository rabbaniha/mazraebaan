import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { OnboardingEventsConsumer } from '../events/onboarding-events.consumer';

@Module({
  controllers: [OnboardingController, OnboardingEventsConsumer],
  providers: [OnboardingService],
})
export class OnboardingModule {}
