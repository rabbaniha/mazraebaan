import { IsString, IsOptional, Length } from 'class-validator';
import { IsUlid } from '../../common/validators/is-ulid.validator';
import { IsGeoJsonMultiPolygon } from '../../common/validators/is-geojson-multipolygon.validator';
import type { GeoJsonMultiPolygon } from '../../common/geometry/geo-json.types';

/**
 * Creates an internal plot. `farm_id` is taken from the route; `farm_boundary_id`
 * pins the plot to an immutable boundary version. Area is derived server-side.
 */
export class CreateFarmPlotDto {
  @IsUlid()
  farm_boundary_id!: string;

  @IsString()
  @Length(1, 100)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  code?: string;

  @IsGeoJsonMultiPolygon()
  geometry!: GeoJsonMultiPolygon;
}
