import type { GeoJsonMultiPolygon } from '../../common/geometry/geo-json.types';

export class FarmPlotResponseDto {
  id!: string;
  farm_id!: string;
  farm_boundary_id!: string;
  name!: string;
  code!: string | null;
  geometry!: GeoJsonMultiPolygon;
  area_m2!: number;
  area_ha!: number;
  created_at!: Date;
  updated_at!: Date;
}
