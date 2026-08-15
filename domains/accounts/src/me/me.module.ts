import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { MeService } from './me.service';
import { AccountMembersModule } from '../account-members/account-members.module';
import { RolesModule } from '../roles/roles.module';
import { AuthModule } from '../common/auth/auth.module';

@Module({
  imports: [AccountMembersModule, RolesModule, AuthModule],
  controllers: [MeController],
  providers: [MeService],
})
export class MeModule {}
