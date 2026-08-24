import { PartialType } from '@nestjs/mapped-types';
import { CreateFarmSeasonDto } from './create-farm-season.dto';

/**
 * Patches a season. `status` is validated against the transition graph by the
 * service (a season cannot leave a terminal state).
 */
export class UpdateFarmSeasonDto extends PartialType(CreateFarmSeasonDto) {}
