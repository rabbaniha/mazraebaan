import { IsIn, IsOptional, IsDateString } from 'class-validator';
import { ACCESS_ROLES, type AccessRole } from '../../common/enums';
import { IsUlid } from '../../common/validators/is-ulid.validator';

/**
 * Grants a farm access role to another user. `farm_id` comes from the route,
 * `granted_by_user_id` from JWT claims, `granted_at` is `now()`.
 */
export class GrantFarmAccessDto {
  @IsUlid()
  grantee_user_id!: string;

  @IsIn(ACCESS_ROLES)
  access_role!: AccessRole;

  @IsOptional()
  @IsDateString()
  expires_at?: string;
}
