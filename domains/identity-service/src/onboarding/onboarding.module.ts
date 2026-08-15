import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsOnboardingClient } from './accounts-onboarding.client';
import { OnboardingSession } from './entities/onboarding-session.entity';
import { OnboardingSessionService } from './onboarding-session.service';

@Module({ imports: [TypeOrmModule.forFeature([OnboardingSession])], providers: [OnboardingSessionService, AccountsOnboardingClient], exports: [OnboardingSessionService, AccountsOnboardingClient] })
export class OnboardingModule {}
