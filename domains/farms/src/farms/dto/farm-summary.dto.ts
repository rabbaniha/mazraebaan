import type { FarmStatus } from '../../common/enums';
import type { GeoJsonPoint } from '../../common/geometry/geo-json.types';

/**
 * Lightweight farm list projection — no full geometry.
 */
export class FarmSummaryDto {
  id!: string;
  code!: string | null;
  name!: string;
  status!: FarmStatus;
  country_code!: string;
  state_province!: string;
  current_area_ha!: number | null;
  current_boundary_id!: string | null;
  centroid!: GeoJsonPoint | null;
  created_at!: Date;
}
