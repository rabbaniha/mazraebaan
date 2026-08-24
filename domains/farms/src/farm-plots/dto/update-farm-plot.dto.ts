import { IsString, IsOptional, Length } from 'class-validator';
import { IsGeoJsonMultiPolygon } from '../../common/validators/is-geojson-multipolygon.validator';
import type { GeoJsonMultiPolygon } from '../../common/geometry/geo-json.types';

/**
 * Patches a plot. `farm_boundary_id` is immutable after creation (moving a plot
 * to another boundary means delete + recreate). Changing `geometry` recomputes
 * the area server-side and re-checks containment within the boundary.
 */
export class UpdateFarmPlotDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  code?: string;

  @IsOptional()
  @IsGeoJsonMultiPolygon()
  geometry?: GeoJsonMultiPolygon;
}
