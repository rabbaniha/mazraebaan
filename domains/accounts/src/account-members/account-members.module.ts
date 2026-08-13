import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountMembersService } from './account-members.service';
import { AccountMembersController } from './account-members.controller';
import { AccountMember } from './entities/account-member.entity';
import { AccountMemberRole } from './entities/account-member-role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AccountMember, AccountMemberRole])],
  controllers: [AccountMembersController],
  providers: [AccountMembersService],
  exports: [AccountMembersService],
})
export class AccountMembersModule {}
