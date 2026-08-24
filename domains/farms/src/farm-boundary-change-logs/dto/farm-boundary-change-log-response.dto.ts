import type { BoundaryChangeType } from '../../common/enums';

export class FarmBoundaryChangeLogResponseDto {
  id!: string;
  farm_id!: string;
  old_boundary_id!: string | null;
  new_boundary_id!: string;
  changed_by_user_id!: string;
  change_type!: BoundaryChangeType;
  reason!: string;
  created_at!: Date;
}
