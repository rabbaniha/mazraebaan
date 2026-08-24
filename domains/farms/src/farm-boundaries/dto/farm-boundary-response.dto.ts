import type { BoundarySource } from '../../common/enums';
import type {
  GeoJsonMultiPolygon,
  GeoJsonPoint,
  GeoJsonPolygon,
} from '../../common/geometry/geo-json.types';

/**
 * Full boundary version projection. `is_current` is DERIVED from
 * `farms.current_boundary_id` at read time — it is never stored.
 */
export class FarmBoundaryResponseDto {
  id!: string;
  farm_id!: string;
  version_no!: number;
  geometry!: GeoJsonMultiPolygon;
  boundary_source!: BoundarySource;
  area_m2!: number;
  area_ha!: number;
  centroid!: GeoJsonPoint;
  bbox!: GeoJsonPolygon;
  valid_from!: Date;
  valid_to!: Date | null;
  change_reason!: string | null;
  created_by_user_id!: string;
  approved_by_user_id!: string | null;
  created_at!: Date;
  is_current!: boolean;
}
