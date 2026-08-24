import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CropTypesService } from './crop-types.service';
import { CreateCropTypeDto } from './dto/create-crop-type.dto';
import { UpdateCropTypeDto } from './dto/update-crop-type.dto';
import { CropTypeQueryDto } from './dto/crop-type-query.dto';

@Controller('crop-types')
export class CropTypesController {
  constructor(private readonly cropTypesService: CropTypesService) {}

  @Post()
  create(@Body() createCropTypeDto: CreateCropTypeDto) {
    return this.cropTypesService.create(createCropTypeDto);
  }

  @Get()
  findAll(@Query() query: CropTypeQueryDto) {
    return this.cropTypesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cropTypesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCropTypeDto: UpdateCropTypeDto) {
    return this.cropTypesService.update(id, updateCropTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cropTypesService.remove(id);
  }
}
