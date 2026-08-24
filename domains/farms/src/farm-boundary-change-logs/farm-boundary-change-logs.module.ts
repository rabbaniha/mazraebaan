import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FarmBoundaryChangeLogsService } from './farm-boundary-change-logs.service';
import { FarmBoundaryChangeLogsController } from './farm-boundary-change-logs.controller';
import { FarmBoundaryChangeLog } from './entities/farm-boundary-change-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FarmBoundaryChangeLog])],
  controllers: [FarmBoundaryChangeLogsController],
  providers: [FarmBoundaryChangeLogsService],
  exports: [FarmBoundaryChangeLogsService],
})
export class FarmBoundaryChangeLogsModule {}
