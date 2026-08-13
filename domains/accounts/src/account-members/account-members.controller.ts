import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AccountMembersService } from './account-members.service';
import { CreateAccountMemberDto } from './dto/create-account-member.dto';
import { UpdateAccountMemberDto } from './dto/update-account-member.dto';

@Controller('account-members')
export class AccountMembersController {
  constructor(private readonly accountMembersService: AccountMembersService) {}

  @Post()
  create(@Body() createAccountMemberDto: CreateAccountMemberDto) {
    return this.accountMembersService.create(createAccountMemberDto);
  }

  @Get()
  findAll() {
    return this.accountMembersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountMembersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAccountMemberDto: UpdateAccountMemberDto,
  ) {
    return this.accountMembersService.update(id, updateAccountMemberDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accountMembersService.remove(id);
  }
}
