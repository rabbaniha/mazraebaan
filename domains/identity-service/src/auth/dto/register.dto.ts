import {
  IsString,
  IsEmail,
  IsOptional,
  Length,
  MinLength,
  MaxLength,
} from 'class-validator';
import { AtLeastOneOf } from '../../common/validators/at-least-one-of.validator';
import { RequireTogether } from '../../common/validators/require-together.validator';

@AtLeastOneOf(['email', 'phoneNumber'], {
  message: 'Provide an email or a mobile number.',
})
@RequireTogether(['phoneNumber', 'phoneCountryCode'], {
  message: 'A phone number requires its country code.',
})
export class RegisterDto {
  // --- Required fields ---

  @IsString()
  @Length(1, 100)
  firstName!: string;

  @IsString()
  @Length(1, 100)
  lastName!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;

  @IsOptional()
  @IsString()
  @Length(5, 15)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @Length(1, 4)
  phoneCountryCode?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  // --- Optional: from user request ---

  @IsOptional()
  @IsString()
  @Length(2, 10)
  locale?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  timezone?: string;
}
