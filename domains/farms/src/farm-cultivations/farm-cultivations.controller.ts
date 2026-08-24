import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { FarmCultivationsService } from './farm-cultivations.service';
import { CreateFarmCultivationDto } from './dto/create-farm-cultivation.dto';
import { UpdateFarmCultivationDto } from './dto/update-farm-cultivation.dto';
import { CurrentUserId } from '../common/auth/current-user.decorator';

@Controller('farms/:farmId/cultivations')
export class FarmCultivationsController {
  constructor(private readonly cultivationsService: FarmCultivationsService) {}

  @Post()
  create(
    @Param('farmId') farmId: string,
    @Body() createFarmCultivationDto: CreateFarmCultivationDto,
    @CurrentUserId() userId: string,
  ) {
    return this.cultivationsService.create(farmId, createFarmCultivationDto, userId);
  }

  @Get()
  findAll(@Param('farmId') farmId: string) {
    return this.cultivationsService.findAll(farmId);
  }

  @Get(':id')
  findOne(@Param('farmId') farmId: string, @Param('id') id: string) {
    return this.cultivationsService.findOne(farmId, id);
  }

  @Patch(':id')
  update(
    @Param('farmId') farmId: string,
    @Param('id') id: string,
    @Body() updateFarmCultivationDto: UpdateFarmCultivationDto,
  ) {
    return this.cultivationsService.update(farmId, id, updateFarmCultivationDto);
  }

  @Delete(':id')
  remove(@Param('farmId') farmId: string, @Param('id') id: string) {
    return this.cultivationsService.remove(farmId, id);
  }
}
