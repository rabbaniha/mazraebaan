import { IsString, IsOptional, Length, MaxLength } from 'class-validator';
import { IsUlid } from '../../common/validators/is-ulid.validator';

/**
 * Creates a farm in `draft` status.
 *
 * `account_id` and `created_by_user_id` are derived from the forwarded JWT
 * claims, never from the request body. All system-managed fields (status,
 * current_boundary_id, spatial snapshots, timestamps, delete metadata) are
 * excluded — they are controlled by the service/domain layer.
 */
export class CreateFarmDto {
  @IsString()
  @Length(1, 200)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  country_code?: string;

  @IsString()
  @Length(1, 100)
  state_province!: string;

  @IsString()
  @Length(1, 100)
  county!: string;

  @IsString()
  @Length(1, 100)
  district!: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  village?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  timezone?: string;

  @IsOptional()
  @IsUlid()
  primary_manager_user_id?: string;
}
