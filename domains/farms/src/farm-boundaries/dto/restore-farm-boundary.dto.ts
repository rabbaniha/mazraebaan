import { IsString, Length } from 'class-validator';
import { IsUlid } from '../../common/validators/is-ulid.validator';

/**
 * Restores a historical boundary. The service copies the historical boundary's
 * geometry into a NEW immutable version (`change_type = restore_old`) — it never
 * reopens or mutates the original row.
 */
export class RestoreFarmBoundaryDto {
  @IsUlid()
  boundary_id!: string;

  @IsString()
  @Length(1, 500)
  change_reason!: string;
}
