import {
  IsString,
  IsOptional,
  IsIn,
  IsInt,
  IsDateString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { SEASON_STATUSES, SEASON_TYPES, type SeasonStatus, type SeasonType } from '../../common/enums';
import { IsStartBeforeEnd } from '../../common/validators/is-start-before-end.validator';

/**
 * Creates a growing season for a farm. `farm_id` is taken from the route.
 */
@IsStartBeforeEnd('start_date', 'end_date', { allowEqual: true })
export class CreateFarmSeasonDto {
  @IsString()
  @Length(1, 100)
  name!: string;

  @IsInt()
  @Min(0)
  @Max(9999)
  crop_year!: number;

  @IsIn(SEASON_TYPES)
  season_type!: SeasonType;

  @IsDateString()
  start_date!: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsIn(SEASON_STATUSES)
  status?: SeasonStatus;
}
