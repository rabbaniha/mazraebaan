import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FarmBoundariesService } from './farm-boundaries.service';
import { FarmBoundariesController } from './farm-boundaries.controller';
import { FarmBoundary } from './entities/farm-boundary.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FarmBoundary])],
  controllers: [FarmBoundariesController],
  providers: [FarmBoundariesService],
  exports: [FarmBoundariesService],
})
export class FarmBoundariesModule {}
