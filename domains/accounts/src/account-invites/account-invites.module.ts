import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountInvitesService } from './account-invites.service';
import { AccountInvitesController } from './account-invites.controller';
import { AccountInvite } from './entities/account-invite.entity';
import { AccountMembersModule } from '../account-members/account-members.module';

@Module({
  imports: [TypeOrmModule.forFeature([AccountInvite]), AccountMembersModule],
  controllers: [AccountInvitesController],
  providers: [AccountInvitesService],
  exports: [AccountInvitesService],
})
export class AccountInvitesModule {}
