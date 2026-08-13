import {
  IsOptional,
  IsIn,
  IsDateString,
  IsString,
  Length,
} from 'class-validator';

export class UpdateStaffAccessGrantDto {
  // --- Access level upgrade/downgrade ---

  @IsOptional()
  @IsIn(['support', 'agronomist', 'admin'])
  accessLevel?: 'support' | 'agronomist' | 'admin';

  // --- Reason update ---

  @IsOptional()
  @IsString()
  @Length(1, 2000)
  reason?: string;

  // --- Time window extension ---

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  // --- Revocation ---

  @IsOptional()
  @IsDateString()
  revokedAt?: string;
}
