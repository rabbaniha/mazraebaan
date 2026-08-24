import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { FarmBoundariesService } from './farm-boundaries.service';
import { CreateFarmBoundaryDto } from './dto/create-farm-boundary.dto';
import { ReplaceFarmBoundaryDto } from './dto/replace-farm-boundary.dto';
import { RestoreFarmBoundaryDto } from './dto/restore-farm-boundary.dto';
import { CurrentUserId } from '../common/auth/current-user.decorator';

@Controller('farms/:farmId/boundaries')
export class FarmBoundariesController {
  constructor(private readonly boundariesService: FarmBoundariesService) {}

  @Post()
  create(
    @Param('farmId') farmId: string,
    @Body() createFarmBoundaryDto: CreateFarmBoundaryDto,
    @CurrentUserId() userId: string,
  ) {
    return this.boundariesService.create(farmId, createFarmBoundaryDto, userId);
  }

  @Post('replace')
  replace(
    @Param('farmId') farmId: string,
    @Body() replaceFarmBoundaryDto: ReplaceFarmBoundaryDto,
    @CurrentUserId() userId: string,
  ) {
    return this.boundariesService.replace(farmId, replaceFarmBoundaryDto, userId);
  }

  @Post('restore')
  restore(
    @Param('farmId') farmId: string,
    @Body() restoreFarmBoundaryDto: RestoreFarmBoundaryDto,
    @CurrentUserId() userId: string,
  ) {
    return this.boundariesService.restore(farmId, restoreFarmBoundaryDto, userId);
  }

  @Get()
  findAll(
    @Param('farmId') farmId: string,
    @Query('include_geometry') includeGeometry?: string,
  ) {
    return this.boundariesService.findAll(
      farmId,
      includeGeometry === 'true',
    );
  }

  @Get(':boundaryId')
  findOne(
    @Param('farmId') farmId: string,
    @Param('boundaryId') boundaryId: string,
  ) {
    return this.boundariesService.findOne(farmId, boundaryId);
  }

  @Patch(':boundaryId/approve')
  approve(
    @Param('boundaryId') boundaryId: string,
    @CurrentUserId() approverUserId: string,
  ) {
    return this.boundariesService.approve(boundaryId, approverUserId);
  }
}
