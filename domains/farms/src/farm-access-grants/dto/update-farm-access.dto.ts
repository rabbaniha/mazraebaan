import { IsIn, IsOptional, IsDateString } from 'class-validator';
import { ACCESS_ROLES, type AccessRole } from '../../common/enums';

/**
 * Updates a grant's role or expiry. Revocation is NOT an update — it is a
 * dedicated operation (`DELETE /farms/:id/grants/:grant_id`) that sets
 * `revoked_at`.
 */
export class UpdateFarmAccessDto {
  @IsOptional()
  @IsIn(ACCESS_ROLES)
  access_role?: AccessRole;

  @IsOptional()
  @IsDateString()
  expires_at?: string;
}
