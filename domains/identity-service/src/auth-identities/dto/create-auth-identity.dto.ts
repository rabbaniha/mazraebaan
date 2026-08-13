import {
  IsString,
  IsOptional,
  IsBoolean,
  IsIn,
  IsEmail,
  Matches,
  IsDateString,
  IsObject,
  Length,
  MaxLength,
} from 'class-validator';

const E164_REGEX = /^\+[1-9]\d{6,14}$/;

export class CreateAuthIdentityDto {
  // --- Relationship ---

  @IsString()
  @Length(26, 26)
  userId!: string;

  // --- Provider ---

  @IsIn(['email_password', 'phone_otp', 'google', 'apple'])
  providerType!: 'email_password' | 'phone_otp' | 'apple' | 'google';

  @IsString()
  @Length(1, 500)
  providerSubject!: string;

  // --- Contact ---

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  emailNormalized?: string;

  @IsOptional()
  @IsString()
  @Matches(E164_REGEX, {
    message: 'phoneE164 must be in E.164 format (e.g. +989****4567)',
  })
  phoneE164?: string;

  // --- Flags ---

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @IsDateString()
  verifiedAt?: string;

  // --- Credentials ---

  @IsOptional()
  @IsString()
  @MaxLength(512)
  credentialHash?: string;

  // --- OAuth / Extension ---

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
