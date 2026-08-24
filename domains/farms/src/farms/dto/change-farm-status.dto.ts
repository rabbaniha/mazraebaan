import { IsIn } from 'class-validator';
import { FARM_STATUSES, type FarmStatus } from '../../common/enums';

/**
 * Requests a farm lifecycle transition. The enum is validated here; the actual
 * transition graph (e.g. `draft → active` requires a boundary) is enforced by
 * the service.
 */
export class ChangeFarmStatusDto {
  @IsIn(FARM_STATUSES)
  status!: FarmStatus;
}
