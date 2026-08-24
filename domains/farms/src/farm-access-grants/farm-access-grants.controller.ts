import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { FarmAccessGrantsService } from './farm-access-grants.service';
import { GrantFarmAccessDto } from './dto/grant-farm-access.dto';
import { UpdateFarmAccessDto } from './dto/update-farm-access.dto';
import { CurrentUserId } from '../common/auth/current-user.decorator';

@Controller('farms/:farmId/grants')
export class FarmAccessGrantsController {
  constructor(private readonly grantsService: FarmAccessGrantsService) {}

  @Post()
  grant(
    @Param('farmId') farmId: string,
    @Body() grantFarmAccessDto: GrantFarmAccessDto,
    @CurrentUserId() grantorUserId: string,
  ) {
    return this.grantsService.grant(farmId, grantFarmAccessDto, grantorUserId);
  }

  @Get()
  findAll(@Param('farmId') farmId: string) {
    return this.grantsService.findAll(farmId);
  }

  @Patch(':grantId')
  update(
    @Param('farmId') farmId: string,
    @Param('grantId') grantId: string,
    @Body() updateFarmAccessDto: UpdateFarmAccessDto,
  ) {
    return this.grantsService.update(farmId, grantId, updateFarmAccessDto);
  }

  @Delete(':grantId')
  revoke(@Param('farmId') farmId: string, @Param('grantId') grantId: string) {
    return this.grantsService.revoke(farmId, grantId);
  }
}
