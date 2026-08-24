import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FarmSeasonsService } from './farm-seasons.service';
import { FarmSeasonsController } from './farm-seasons.controller';
import { FarmSeason } from './entities/farm-season.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FarmSeason])],
  controllers: [FarmSeasonsController],
  providers: [FarmSeasonsService],
  exports: [FarmSeasonsService],
})
export class FarmSeasonsModule {}
