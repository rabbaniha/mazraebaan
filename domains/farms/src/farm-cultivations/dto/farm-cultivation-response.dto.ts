import type { CultivationMode, CultivationStatus } from '../../common/enums';

/** Minimal crop type projection embedded in a cultivation response. */
export class CropTypeSummaryDto {
  id!: string;
  code!: string;
  name_fa!: string;
  name_en!: string;
}

export class FarmCultivationResponseDto {
  id!: string;
  farm_id!: string;
  farm_season_id!: string | null;
  farm_plot_id!: string | null;
  crop_type_id!: string;
  crop_type!: CropTypeSummaryDto | null;
  cultivation_mode!: CultivationMode;
  sowing_date!: string | null;
  transplant_date!: string | null;
  harvest_date!: string | null;
  expected_harvest_date!: string | null;
  status!: CultivationStatus;
  notes!: string | null;
  created_by_user_id!: string;
  created_at!: Date;
  updated_at!: Date;
}
