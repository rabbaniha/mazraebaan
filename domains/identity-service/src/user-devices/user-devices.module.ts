import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserDevicesService } from './user-devices.service';
import { UserDevicesController } from './user-devices.controller';
import { UserDevice } from './entities/user-device.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserDevice])],
  controllers: [UserDevicesController],
  providers: [UserDevicesService],
})
export class UserDevicesModule {}
