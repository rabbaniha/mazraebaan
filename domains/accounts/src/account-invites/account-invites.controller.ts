import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AccountInvitesService } from './account-invites.service';
import { CreateAccountInviteDto } from './dto/create-account-invite.dto';
import { UpdateAccountInviteDto } from './dto/update-account-invite.dto';
import { CurrentUserId } from '../common/auth/current-user.decorator';

@Controller('account-invites')
export class AccountInvitesController {
  constructor(private readonly accountInvitesService: AccountInvitesService) {}

  // createdBy is the account owner/admin initiating the invite (Rule 5),
  // taken from the verified JWT `sub` claim (never client headers).
  @Post()
  create(@CurrentUserId() createdBy: string, @Body() dto: CreateAccountInviteDto) {
    return this.accountInvitesService.create(dto, createdBy);
  }

  @Get()
  findAll() {
    return this.accountInvitesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountInvitesService.findOne(id);
  }

  // userId comes from the invitee's verified JWT `sub` claim.
  @Post(':id/accept')
  accept(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.accountInvitesService.accept(id, userId);
  }

  @Post(':id/decline')
  decline(@Param('id') id: string) {
    return this.accountInvitesService.decline(id);
  }

  @Post(':id/revoke')
  revoke(@Param('id') id: string) {
    return this.accountInvitesService.revoke(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAccountInviteDto) {
    return this.accountInvitesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accountInvitesService.remove(id);
  }
}
