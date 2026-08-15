import { IsString, IsEmail, IsOptional, MinLength, MaxLength, Length } from 'class-validator';
import { AtLeastOneOf } from '../../common/validators/at-least-one-of.validator';
import { RequireTogether } from '../../common/validators/require-together.validator';

@AtLeastOneOf(['email', 'phoneNumber'], { message: 'Provide an email or a mobile number.' })
@RequireTogether(['phoneNumber', 'phoneCountryCode'], { message: 'A phone number requires its country code.' })
export class LoginDto {
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
}
