import {
  IsString,
  IsOptional,
  IsArray,
  IsDateString,
  ArrayMaxSize,
  Length,
} from 'class-validator';

// ULID format: 26 base32 characters

export class CreateAccountMemberDto {
  // --- Relationships ---

  @IsString()
  @Length(26, 26)
  accountId!: string;

  @IsString()
  @Length(26, 26)
  userId!: string;

  // --- Invitation ---

  @IsDateString()
  invitedAt!: string;

  @IsOptional()
  @IsString()
  @Length(26, 26)
  invitedBy?: string;

  // --- Roles (assigned at invitation time) ---

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @Length(26, 26, { each: true })
  roleIds?: string[];
}
