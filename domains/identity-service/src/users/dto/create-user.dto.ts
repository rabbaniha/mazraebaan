import {
  IsString,
  IsEmail,
  IsOptional,
  Matches,
  IsDateString,
  Length,
  MaxLength,
  IsIn,
} from 'class-validator';
import { AtLeastOneOf } from '../../common/validators/at-least-one-of.validator';
import { RequireTogether } from '../../common/validators/require-together.validator';

// Local phone number: 5-15 digits, no leading 0
const PHONE_LOCAL_REGEX = /^[1-9]\d{4,14}$/;

// Country dial code: 1-4 digits after + (e.g. '98', '1', '44')
const PHONE_COUNTRY_CODE_REGEX = /^\d{1,4}$/;

@AtLeastOneOf(['email', 'phoneNumber'], {
  message: 'At least one of email or phoneNumber must be provided',
})
@RequireTogether(['phoneNumber', 'phoneCountryCode'], {
  message:
    'When providing phoneNumber, phoneCountryCode is also required (and vice versa)',
})
export class CreateUserDto {
  // --- Profile ---

  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @IsString()
  @Length(1, 200)
  displayName!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;

  // Phone: local digits only, no leading 0, no country code prefix

  @IsOptional()
  @IsString()
  @Matches(PHONE_LOCAL_REGEX, {
    message:
      'phoneNumber must be local digits only (5-15 digits, no leading 0)',
  })
  phoneNumber?: string;

  // Country dial code without '+' (e.g. '98' for Iran, '1' for US)

  @IsOptional()
  @IsString()
  @Matches(PHONE_COUNTRY_CODE_REGEX, {
    message: 'phoneCountryCode must be 1-4 digits without + prefix',
  })
  phoneCountryCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  avatarUrl?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  // --- Localization (preferredLanguage removed — locale covers it) ---

  @IsOptional()
  @IsString()
  @Length(2, 10)
  locale?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  timezone?: string;

  @IsOptional()
  @IsIn(['jalali', 'gregorian'])
  calendarPreference?: 'jalali' | 'gregorian';
}
