import {
  IsString,
  IsOptional,
  IsIn,
  IsDateString,
  MaxLength,
} from 'class-validator';
import {
  CULTIVATION_MODES,
  CULTIVATION_STATUSES,
  type CultivationMode,
  type CultivationStatus,
} from '../../common/enums';
import { IsUlid } from '../../common/validators/is-ulid.validator';
import { IsStartBeforeEnd } from '../../common/validators/is-start-before-end.validator';

/**
 * Patches a cultivation. `crop_type_id` is immutable after creation. `status`
 * is validated against the transition graph by the service.
 */
@IsStartBeforeEnd('sowing_date', 'transplant_date', { allowEqual: true })
@IsStartBeforeEnd('transplant_date', 'harvest_date', { allowEqual: true })
@IsStartBeforeEnd('sowing_date', 'harvest_date', { allowEqual: true })
@IsStartBeforeEnd('sowing_date', 'expected_harvest_date', { allowEqual: true })
export class UpdateFarmCultivationDto {
  @IsOptional()
  @IsUlid()
  farm_season_id?: string;

  @IsOptional()
  @IsUlid()
  farm_plot_id?: string;

  @IsOptional()
  @IsIn(CULTIVATION_MODES)
  cultivation_mode?: CultivationMode;

  @IsOptional()
  @IsDateString()
  sowing_date?: string;

  @IsOptional()
  @IsDateString()
  transplant_date?: string;

  @IsOptional()
  @IsDateString()
  harvest_date?: string;

  @IsOptional()
  @IsDateString()
  expected_harvest_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsIn(CULTIVATION_STATUSES)
  status?: CultivationStatus;
}
