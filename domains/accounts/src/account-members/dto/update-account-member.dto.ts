import {
  IsString,
  IsOptional,
  IsArray,
  IsIn,
  IsDateString,
  ArrayMaxSize,
  Length,
} from 'class-validator';

export class UpdateAccountMemberDto {
  // --- Lifecycle states (no boolean flags) ---

  @IsOptional()
  @IsIn(['invited', 'active', 'removed', 'declined'])
  status?: 'invited' | 'active' | 'removed' | 'declined';

  @IsOptional()
  @IsDateString()
  joinedAt?: string;

  @IsOptional()
  @IsDateString()
  lastActiveAt?: string;

  // --- Removal ---

  @IsOptional()
  @IsString()
  @Length(26, 26)
  removedBy?: string;

  @IsOptional()
  @IsDateString()
  removedAt?: string;

  // --- Role reassignment ---

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @Length(26, 26, { each: true })
  roleIds?: string[];
}
