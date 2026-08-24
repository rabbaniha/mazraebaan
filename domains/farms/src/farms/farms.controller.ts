import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { FarmsService } from './farms.service';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { ChangeFarmStatusDto } from './dto/change-farm-status.dto';
import {
  CurrentAccountId,
  CurrentUserId,
} from '../common/auth/current-user.decorator';

@Controller('farms')
export class FarmsController {
  constructor(private readonly farmsService: FarmsService) {}

  @Post()
  create(
    @Body() createFarmDto: CreateFarmDto,
    @CurrentAccountId() accountId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.farmsService.create(createFarmDto, accountId, userId);
  }

  @Get()
  findAll(@CurrentAccountId() accountId: string) {
    return this.farmsService.findAll(accountId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.farmsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFarmDto: UpdateFarmDto) {
    return this.farmsService.update(id, updateFarmDto);
  }

  @Patch(':id/status')
  changeStatus(
    @Param('id') id: string,
    @Body() changeFarmStatusDto: ChangeFarmStatusDto,
  ) {
    return this.farmsService.changeStatus(id, changeFarmStatusDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.farmsService.remove(id);
  }
}
