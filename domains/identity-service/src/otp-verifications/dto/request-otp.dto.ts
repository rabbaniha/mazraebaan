import {
  IsString,
  IsEmail,
  IsOptional,
  IsIn,
  Length,
  MaxLength,
  Matches,
} from 'class-validator';

export class RequestOtpDto {
  @IsString()
  @IsIn([
    'register_email',
    'register_phone',
    'login_email',
    'login_phone',
    'verify_change',
  ])
  purpose!:
    | 'register_email'
    | 'register_phone'
    | 'login_email'
    | 'login_phone'
    | 'verify_change';

  // --- Contact (one is required depending on purpose) ---

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;

  // E.164 format: +9891234567890
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: 'phone must be in E.164 format (e.g. +9891234567890)',
  })
  phone?: string;

  // --- User context (derived from JWT or registration context) ---

  @IsOptional()
  @IsString()
  @Length(26, 26)
  userId?: string;
}
