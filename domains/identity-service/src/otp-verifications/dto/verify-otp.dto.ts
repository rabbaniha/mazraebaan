import { IsString, IsIn, Length, IsOptional } from 'class-validator';

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

  @IsOptional()
  @IsString()
  @Length(26, 26)
  userId?: string;
}
