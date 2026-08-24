import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { FarmPlotsService } from './farm-plots.service';
import { CreateFarmPlotDto } from './dto/create-farm-plot.dto';
import { UpdateFarmPlotDto } from './dto/update-farm-plot.dto';

@Controller('farms/:farmId/plots')
export class FarmPlotsController {
  constructor(private readonly plotsService: FarmPlotsService) {}

  @Post()
  create(
    @Param('farmId') farmId: string,
    @Body() createFarmPlotDto: CreateFarmPlotDto,
  ) {
    return this.plotsService.create(farmId, createFarmPlotDto);
  }

  @Get()
  findAll(@Param('farmId') farmId: string) {
    return this.plotsService.findAll(farmId);
  }

  @Get(':id')
  findOne(@Param('farmId') farmId: string, @Param('id') id: string) {
    return this.plotsService.findOne(farmId, id);
  }

  @Patch(':id')
  update(
    @Param('farmId') farmId: string,
    @Param('id') id: string,
    @Body() updateFarmPlotDto: UpdateFarmPlotDto,
  ) {
    return this.plotsService.update(farmId, id, updateFarmPlotDto);
  }

  @Delete(':id')
  remove(@Param('farmId') farmId: string, @Param('id') id: string) {
    return this.plotsService.remove(farmId, id);
  }
}
