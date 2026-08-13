import {
  IsString,
  IsEmail,
  IsOptional,
  Length,
  MinLength,
  MaxLength,
} from 'class-validator';

export class RegisterDto {
  // --- Required fields ---

  @IsString()
  @Length(1, 100)
  firstName!: string;

  @IsString()
  @Length(1, 100)
  lastName!: string;

  @IsEmail()
  @MaxLength(320)
  email!: string;

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
