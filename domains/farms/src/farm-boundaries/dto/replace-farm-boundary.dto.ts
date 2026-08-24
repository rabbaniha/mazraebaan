import { IsIn, IsString, Length } from 'class-validator';
import { BOUNDARY_SOURCES, type BoundarySource } from '../../common/enums';
import { IsGeoJsonMultiPolygon } from '../../common/validators/is-geojson-multipolygon.validator';
import type { GeoJsonMultiPolygon } from '../../common/geometry/geo-json.types';

/**
 * Replaces the farm's current boundary with new geometry. This is a DOMAIN
 * OPERATION, not a generic update: the caller provides only geometry + source +
 * reason. `version_no`, `farm_id`, `is_current`, `valid_from`, `valid_to`,
 * areas, centroid/bbox and `approved_by_user_id` are forbidden and controlled
 * by the service.
 */
export class ReplaceFarmBoundaryDto {
  @IsGeoJsonMultiPolygon()
  geometry!: GeoJsonMultiPolygon;

  @IsIn(BOUNDARY_SOURCES)
  boundary_source!: BoundarySource;

  @IsString()
  @Length(1, 500)
  change_reason!: string;
}
