import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FarmAccessGrantsService } from './farm-access-grants.service';
import { FarmAccessGrantsController } from './farm-access-grants.controller';
import { FarmAccessGrant } from './entities/farm-access-grant.entity';
import { Farm } from '../farms/entities/farm.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FarmAccessGrant, Farm])],
  controllers: [FarmAccessGrantsController],
  providers: [FarmAccessGrantsService],
  exports: [FarmAccessGrantsService],
})
export class FarmAccessGrantsModule {}
