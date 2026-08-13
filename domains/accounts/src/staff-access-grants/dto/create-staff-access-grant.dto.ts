import {
  IsString,
  IsOptional,
  IsIn,
  IsDateString,
  Length,
} from 'class-validator';
import { IsStartBeforeEnd } from '../../common/validators/is-start-before-end.validator';

@IsStartBeforeEnd('startsAt', 'expiresAt', {
  message: 'startsAt must be strictly before expiresAt',
})
export class CreateStaffAccessGrantDto {
  // --- Staff member ---

  @IsString()
  @Length(26, 26)
  staffUserId!: string;

  // --- Scope targets (polymorphic — service enforces that at least one is set) ---

  @IsOptional()
  @IsString()
  @Length(26, 26)
  accountId?: string;

  @IsOptional()
  @IsString()
  @Length(26, 26)
  farmId?: string;

  // --- Access classification ---

  @IsIn(['system', 'account', 'farm'])
  accessScope!: 'system' | 'account' | 'farm';

  @IsIn(['support', 'agronomist', 'admin'])
  accessLevel!: 'support' | 'agronomist' | 'admin';

  // --- Authorization ---

  @IsString()
  @Length(26, 26)
  grantedByUserId!: string;

  // --- Audit reason ---

  @IsString()
  @Length(1, 2000)
  reason!: string;

  // --- Time window (cross-field validated by class decorator above) ---

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  expiresAt!: string;
}
