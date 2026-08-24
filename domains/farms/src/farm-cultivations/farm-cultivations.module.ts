import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FarmCultivationsService } from './farm-cultivations.service';
import { FarmCultivationsController } from './farm-cultivations.controller';
import { FarmCultivation } from './entities/farm-cultivation.entity';
import { CropType } from '../crop-types/entities/crop-type.entity';
import { FarmSeason } from '../farm-seasons/entities/farm-season.entity';
import { FarmPlot } from '../farm-plots/entities/farm-plot.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FarmCultivation, CropType, FarmSeason, FarmPlot]),
  ],
  controllers: [FarmCultivationsController],
  providers: [FarmCultivationsService],
  exports: [FarmCultivationsService],
})
export class FarmCultivationsModule {}
