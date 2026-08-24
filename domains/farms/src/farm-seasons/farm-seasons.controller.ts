import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { FarmSeasonsService } from './farm-seasons.service';
import { CreateFarmSeasonDto } from './dto/create-farm-season.dto';
import { UpdateFarmSeasonDto } from './dto/update-farm-season.dto';

@Controller('farms/:farmId/seasons')
export class FarmSeasonsController {
  constructor(private readonly seasonsService: FarmSeasonsService) {}

  @Post()
  create(
    @Param('farmId') farmId: string,
    @Body() createFarmSeasonDto: CreateFarmSeasonDto,
  ) {
    return this.seasonsService.create(farmId, createFarmSeasonDto);
  }

  @Get()
  findAll(@Param('farmId') farmId: string) {
    return this.seasonsService.findAll(farmId);
  }

  @Get(':id')
  findOne(@Param('farmId') farmId: string, @Param('id') id: string) {
    return this.seasonsService.findOne(farmId, id);
  }

  @Patch(':id')
  update(
    @Param('farmId') farmId: string,
    @Param('id') id: string,
    @Body() updateFarmSeasonDto: UpdateFarmSeasonDto,
  ) {
    return this.seasonsService.update(farmId, id, updateFarmSeasonDto);
  }

  @Delete(':id')
  remove(@Param('farmId') farmId: string, @Param('id') id: string) {
    return this.seasonsService.remove(farmId, id);
  }
}
