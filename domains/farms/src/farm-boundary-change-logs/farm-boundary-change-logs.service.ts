import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FarmBoundaryChangeLog } from './entities/farm-boundary-change-log.entity';
import { FarmBoundaryChangeLogResponseDto } from './dto/farm-boundary-change-log-response.dto';

@Injectable()
export class FarmBoundaryChangeLogsService {
  constructor(
    @InjectRepository(FarmBoundaryChangeLog)
    private readonly logRepo: Repository<FarmBoundaryChangeLog>,
  ) {}

  async findAll(farmId: string): Promise<FarmBoundaryChangeLogResponseDto[]> {
    const logs = await this.logRepo.find({
      where: { farmId },
      order: { createdAt: 'DESC' },
    });
    return logs.map((l) => {
      const dto = new FarmBoundaryChangeLogResponseDto();
      dto.id = l.id;
      dto.farm_id = l.farmId;
      dto.old_boundary_id = l.oldBoundaryId;
      dto.new_boundary_id = l.newBoundaryId;
      dto.changed_by_user_id = l.changedByUserId;
      dto.change_type = l.changeType;
      dto.reason = l.reason;
      dto.created_at = l.createdAt;
      return dto;
    });
  }
}
