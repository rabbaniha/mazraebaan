import { Injectable } from '@nestjs/common';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  create(_createOrganizationDto: CreateOrganizationDto) {
    return 'This action adds a new organization';
  }

  findAll() {
    return `This action returns all organizations`;
  }

  findOne(_id: number) {
    return `This action returns a #${_id} organization`;
  }

  update(_id: number, _updateOrganizationDto: UpdateOrganizationDto) {
    return `This action updates a #${_id} organization`;
  }

  remove(_id: number) {
    return `This action removes a #${_id} organization`;
  }
}
