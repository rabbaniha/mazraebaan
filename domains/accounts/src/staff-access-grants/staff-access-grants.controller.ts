import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { StaffAccessGrantsService } from './staff-access-grants.service';
import { CreateStaffAccessGrantDto } from './dto/create-staff-access-grant.dto';
import { UpdateStaffAccessGrantDto } from './dto/update-staff-access-grant.dto';

@Controller('staff-access-grants')
export class StaffAccessGrantsController {
  constructor(
    private readonly staffAccessGrantsService: StaffAccessGrantsService,
  ) {}

  @Post()
  create(@Body() createStaffAccessGrantDto: CreateStaffAccessGrantDto) {
    return this.staffAccessGrantsService.create(createStaffAccessGrantDto);
  }

  @Get()
  findAll() {
    return this.staffAccessGrantsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.staffAccessGrantsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStaffAccessGrantDto: UpdateStaffAccessGrantDto,
  ) {
    return this.staffAccessGrantsService.update(+id, updateStaffAccessGrantDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.staffAccessGrantsService.remove(+id);
  }
}
