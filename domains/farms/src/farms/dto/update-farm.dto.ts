import { PartialType } from '@nestjs/mapped-types';
import { CreateFarmDto } from './create-farm.dto';

/**
 * Patches editable farm metadata. `status` is deliberately excluded (see
 * ChangeFarmStatusDto) and so are `current_boundary_id` and all spatial
 * snapshots / timestamps.
 */
export class UpdateFarmDto extends PartialType(CreateFarmDto) {}
