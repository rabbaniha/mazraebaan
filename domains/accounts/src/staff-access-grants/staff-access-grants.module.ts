import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffAccessGrantsService } from './staff-access-grants.service';
import { StaffAccessGrantsController } from './staff-access-grants.controller';
import { StaffAccessGrant } from './entities/staff-access-grant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StaffAccessGrant])],
  controllers: [StaffAccessGrantsController],
  providers: [StaffAccessGrantsService],
})
export class StaffAccessGrantsModule {}
