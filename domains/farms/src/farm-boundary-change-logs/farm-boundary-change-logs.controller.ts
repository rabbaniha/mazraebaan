import { Controller, Get, Param } from '@nestjs/common';
import { FarmBoundaryChangeLogsService } from './farm-boundary-change-logs.service';

@Controller('farms/:farmId/boundary-change-logs')
export class FarmBoundaryChangeLogsController {
  constructor(private readonly changeLogsService: FarmBoundaryChangeLogsService) {}

  @Get()
  findAll(@Param('farmId') farmId: string) {
    return this.changeLogsService.findAll(farmId);
  }
}
