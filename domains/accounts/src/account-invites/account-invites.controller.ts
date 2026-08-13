import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Headers,
} from '@nestjs/common';
import { AccountInvitesService } from './account-invites.service';
import { CreateAccountInviteDto } from './dto/create-account-invite.dto';
import { UpdateAccountInviteDto } from './dto/update-account-invite.dto';

@Controller('account-invites')
export class AccountInvitesController {
  constructor(private readonly accountInvitesService: AccountInvitesService) {}

  // createdBy is the account owner/admin initiating the invite (Rule 5).
  // TODO: replace x-user-id header with JWT claim forwarded by api-gateway.
  @Post()
  create(
    @Body() dto: CreateAccountInviteDto,
    @Headers('x-user-id') createdBy?: string,
  ) {
    return this.accountInvitesService.create(dto, createdBy ?? '');
  }

  @Get()
  findAll() {
    return this.accountInvitesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountInvitesService.findOne(id);
  }

  // userId comes from the invitee's authenticated identity (JWT).
  // TODO: replace x-user-id header with JWT claim forwarded by api-gateway.
  @Post(':id/accept')
  accept(@Param('id') id: string, @Headers('x-user-id') userId?: string) {
    return this.accountInvitesService.accept(id, userId ?? '');
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
