import type { FarmStatus } from '../../common/enums';
import type { GeoJsonPoint, GeoJsonPolygon } from '../../common/geometry/geo-json.types';

/**
 * Full farm projection. Geometry is GeoJSON (API representation), not the
 * PostGIS persistence representation. `deleted_at`/`purge_after` are only
 * populated for deleted farms (or admin callers) by the service.
 */
export class FarmResponseDto {
  id!: string;
  account_id!: string;
  code!: string | null;
  name!: string;
  description!: string | null;
  status!: FarmStatus;
  primary_manager_user_id!: string | null;
  country_code!: string;
  state_province!: string;
  county!: string;
  district!: string;
  village!: string | null;
  timezone!: string;
  current_boundary_id!: string | null;
  centroid!: GeoJsonPoint | null;
  bbox!: GeoJsonPolygon | null;
  current_area_m2!: number | null;
  current_area_ha!: number | null;
  created_at!: Date;
  updated_at!: Date;
  deleted_at!: Date | null;
  purge_after!: Date | null;
}
