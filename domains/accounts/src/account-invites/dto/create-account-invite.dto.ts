import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsDateString,
  ArrayMaxSize,
  Length,
} from 'class-validator';

export class CreateAccountInviteDto {
  // --- Target account (owned by this service) ---

  @IsString()
  @Length(26, 26)
  accountId!: string;

  // --- Invitation is always bound to an email (Rule 6) ---

  @IsEmail()
  @Length(1, 320)
  email!: string;

  // --- Proposed roles assigned when the invite is accepted ---

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @Length(26, 26, { each: true })
  roleIds?: string[];

  // --- Expiration (optional — service defaults to policy-based TTL, Rule 8) ---

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
