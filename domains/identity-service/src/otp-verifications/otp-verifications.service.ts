import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull } from 'typeorm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { OtpVerification } from './entities/otp-verification.entity';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const OTP_BCRYPT_ROUNDS = 10;

@Injectable()
export class OtpVerificationsService {
  constructor(
    @InjectRepository(OtpVerification)
    private readonly otpRepo: Repository<OtpVerification>,
  ) {}

  /**
   * Generate a new OTP for the given purpose.
   * Invalidates any previous unused OTPs for the same (userId, purpose).
   * Logs the OTP to console (will be replaced by notifications-service).
   *
   * Returns the raw OTP code (only for logging — never stored).
   */
  async requestOtp(dto: RequestOtpDto): Promise<{ expiresAt: Date }> {
    if (!dto.userId) {
      throw new BadRequestException('userId is required to request an OTP');
    }

    // Invalidate any active OTPs for this user + purpose
    await this.otpRepo.delete({
      userId: dto.userId,
      purpose: dto.purpose,
      verifiedAt: IsNull(), // only delete unverified ones
    });

    // Generate 6-digit code
    const rawCode = this.generateCode();
    const codeHash = await bcrypt.hash(rawCode, OTP_BCRYPT_ROUNDS);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const otp = this.otpRepo.create({
      userId: dto.userId,
      codeHash,
      purpose: dto.purpose,
      expiresAt,
      maxAttempts: 5,
      attemptCount: 0,
    });
    await this.otpRepo.save(otp);

    // TODO: Replace with notifications-service event (Outbox Pattern)
    const target = dto.email ?? dto.phone ?? 'unknown';
    console.log(
      `[OTP] purpose=${dto.purpose} target=${target} code=${rawCode} expires=${expiresAt.toISOString()}`,
    );

    return { expiresAt };
  }

  /**
   * Verify an OTP code.
   * Returns true if valid, throws on failure.
   */
  async verifyOtp(dto: VerifyOtpDto): Promise<boolean> {
    // Find the latest unverified OTP for this user+purpose
    const otp = await this.otpRepo.findOne({
      where: {
        purpose: dto.purpose,
        verifiedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });

    if (!otp) {
      throw new NotFoundException(
        'No active OTP found. Please request a new code.',
      );
    }

    // Check attempt count
    if (otp.attemptCount >= otp.maxAttempts) {
      throw new ConflictException(
        'Maximum OTP attempts exceeded. Please request a new code.',
      );
    }

    // Increment attempt count
    otp.attemptCount += 1;
    await this.otpRepo.save(otp);

    // Compare
    const isValid = await bcrypt.compare(dto.code, otp.codeHash);
    if (!isValid) {
      throw new BadRequestException('Invalid OTP code.');
    }

    // Mark as verified
    otp.verifiedAt = new Date();
    await this.otpRepo.save(otp);

    return true;
  }

  /**
   * Resend OTP: invalidates existing and generates a new one.
   */
  async resendOtp(dto: RequestOtpDto): Promise<{ expiresAt: Date }> {
    return this.requestOtp(dto);
  }

  /**
   * Check if a user has a verified OTP for the given purpose.
   */
  async hasVerifiedOtp(
    userId: string,
    purpose: OtpVerification['purpose'],
  ): Promise<boolean> {
    const count = await this.otpRepo.count({
      where: {
        userId,
        purpose,
        verifiedAt: MoreThan(new Date(0)),
      },
    });
    return count > 0;
  }

  // --- Private helpers ---

  private generateCode(): string {
    // Cryptographically secure 6-digit code
    const bytes = crypto.randomBytes(4);
    const num = bytes.readUInt32BE(0);
    return String(num % 1000000).padStart(OTP_LENGTH, '0');
  }
}
