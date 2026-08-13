import { Injectable } from '@nestjs/common';
import { CreateUserDeviceDto } from './dto/create-user-device.dto';
import { UpdateUserDeviceDto } from './dto/update-user-device.dto';

@Injectable()
export class UserDevicesService {
  create(_createUserDeviceDto: CreateUserDeviceDto) {
    return 'This action adds a new userDevice';
  }

  findAll() {
    return `This action returns all userDevices`;
  }

  findOne(_id: number) {
    return `This action returns a #${_id} userDevice`;
  }

  update(_id: number, _updateUserDeviceDto: UpdateUserDeviceDto) {
    return `This action updates a #${_id} userDevice`;
  }

  remove(_id: number) {
    return `This action removes a #${_id} userDevice`;
  }
}
