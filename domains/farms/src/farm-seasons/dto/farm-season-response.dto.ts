import type { SeasonStatus, SeasonType } from '../../common/enums';

export class FarmSeasonResponseDto {
  id!: string;
  farm_id!: string;
  name!: string;
  crop_year!: number;
  season_type!: SeasonType;
  start_date!: string;
  end_date!: string | null;
  status!: SeasonStatus;
  created_at!: Date;
}
