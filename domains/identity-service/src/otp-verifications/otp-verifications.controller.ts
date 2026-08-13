import { Controller, Post, Body } from '@nestjs/common';
import { OtpVerificationsService } from './otp-verifications.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('otp')
export class OtpVerificationsController {
  constructor(private readonly otpService: OtpVerificationsService) {}

  @Post('request')
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.otpService.requestOtp(dto);
  }

  @Post('verify')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.otpService.verifyOtp(dto);
  }

  @Post('resend')
  resendOtp(@Body() dto: RequestOtpDto) {
    return this.otpService.resendOtp(dto);
  }
}
