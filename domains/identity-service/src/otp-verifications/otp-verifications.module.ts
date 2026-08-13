import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpVerification } from './entities/otp-verification.entity';
import { OtpVerificationsService } from './otp-verifications.service';
import { OtpVerificationsController } from './otp-verifications.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OtpVerification])],
  controllers: [OtpVerificationsController],
  providers: [OtpVerificationsService],
  exports: [OtpVerificationsService],
})
export class OtpVerificationsModule {}
