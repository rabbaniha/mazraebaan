import { Injectable } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  create(_createPermissionDto: CreatePermissionDto) {
    return 'This action adds a new permission';
  }

  findAll() {
    return `This action returns all permissions`;
  }

  findOne(_id: number) {
    return `This action returns a #${_id} permission`;
  }

  update(_id: number, _updatePermissionDto: UpdatePermissionDto) {
    return `This action updates a #${_id} permission`;
  }

  remove(_id: number) {
    return `This action removes a #${_id} permission`;
  }
}
