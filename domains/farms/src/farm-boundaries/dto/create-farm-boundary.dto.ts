import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { BOUNDARY_SOURCES, type BoundarySource } from '../../common/enums';
import { IsGeoJsonMultiPolygon } from '../../common/validators/is-geojson-multipolygon.validator';
import type { GeoJsonMultiPolygon } from '../../common/geometry/geo-json.types';

/**
 * Creates the FIRST boundary for a farm. Only valid while the farm has no
 * current boundary — a subsequent boundary change must use ReplaceFarmBoundaryDto
 * or RestoreFarmBoundaryDto. `version_no`, `farm_id`, `valid_from`/`valid_to`,
 * areas and geometry snapshots are all derived server-side and excluded here.
 */
export class CreateFarmBoundaryDto {
  @IsGeoJsonMultiPolygon()
  geometry!: GeoJsonMultiPolygon;

  @IsIn(BOUNDARY_SOURCES)
  boundary_source!: BoundarySource;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  change_reason?: string;
}
