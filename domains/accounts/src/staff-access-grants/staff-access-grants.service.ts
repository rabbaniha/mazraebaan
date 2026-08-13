import { Injectable } from '@nestjs/common';
import { CreateStaffAccessGrantDto } from './dto/create-staff-access-grant.dto';
import { UpdateStaffAccessGrantDto } from './dto/update-staff-access-grant.dto';

@Injectable()
export class StaffAccessGrantsService {
  create(_createStaffAccessGrantDto: CreateStaffAccessGrantDto) {
    return 'This action adds a new staffAccessGrant';
  }

  findAll() {
    return `This action returns all staffAccessGrants`;
  }

  findOne(_id: number) {
    return `This action returns a #${_id} staffAccessGrant`;
  }

  update(_id: number, _updateStaffAccessGrantDto: UpdateStaffAccessGrantDto) {
    return `This action updates a #${_id} staffAccessGrant`;
  }

  remove(_id: number) {
    return `This action removes a #${_id} staffAccessGrant`;
  }
}
