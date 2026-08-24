import type { BoundarySource } from '../../common/enums';
import type { GeoJsonMultiPolygon } from '../../common/geometry/geo-json.types';

/**
 * Compact boundary history item. Geometry is omitted by default to keep list
 * payloads small; it is included when the caller passes `include_geometry=true`.
 */
export class FarmBoundaryHistoryDto {
  id!: string;
  version_no!: number;
  valid_from!: Date;
  valid_to!: Date | null;
  boundary_source!: BoundarySource;
  area_ha!: number;
  change_reason!: string | null;
  created_by_user_id!: string;
  created_at!: Date;
  is_current!: boolean;
  geometry?: GeoJsonMultiPolygon;
}
