import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CropTypesService } from './crop-types.service';
import { CropTypesController } from './crop-types.controller';
import { CropType } from './entities/crop-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CropType])],
  controllers: [CropTypesController],
  providers: [CropTypesService],
  exports: [CropTypesService],
})
export class CropTypesModule {}
