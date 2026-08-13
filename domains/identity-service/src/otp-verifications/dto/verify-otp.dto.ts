import { IsString, IsEmail, IsIn, Length, MaxLength } from 'class-validator';

export class VerifyOtpDto {
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

  @IsString()
  @Length(6, 6)
  code!: string;

  // --- Contact (used to identify the user) ---

  @IsEmail()
  @MaxLength(320)
  email!: string;
}
