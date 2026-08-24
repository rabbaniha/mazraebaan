import type { AccessRole } from '../../common/enums';

/**
 * Access grant projection. `is_active` is DERIVED
 * (`revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now())`).
 */
export class FarmAccessGrantResponseDto {
  id!: string;
  farm_id!: string;
  grantee_user_id!: string;
  access_role!: AccessRole;
  granted_by_user_id!: string;
  granted_at!: Date;
  expires_at!: Date | null;
  revoked_at!: Date | null;
  created_at!: Date;
  is_active!: boolean;
}
