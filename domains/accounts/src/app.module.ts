import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccountsModule } from './accounts/accounts.module';
import { AccountMembersModule } from './account-members/account-members.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { AccountInvitesModule } from './account-invites/account-invites.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { StaffAccessGrantsModule } from './staff-access-grants/staff-access-grants.module';
import { MeModule } from './me/me.module';
import { AccessTokenGuard } from './common/auth/access-token.guard';
import { JwtPublicKeyService } from './common/auth/jwt-public-key.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USER ?? 'mazraebaan',
      password: process.env.DB_PASS ?? 'mazraebaan_dev_pass',
      database: process.env.DB_NAME ?? 'accounts_db',
      autoLoadEntities: true,
      // Never auto-sync schema — use migrations for DDL changes.
      synchronize: true,
    }),
    AccountsModule,
    AccountMembersModule,
    RolesModule,
    PermissionsModule,
    AccountInvitesModule,
    OrganizationsModule,
    StaffAccessGrantsModule,
    MeModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtPublicKeyService,
    AccessTokenGuard,
    {
      provide: APP_GUARD,
      useExisting: AccessTokenGuard,
    },
  ],
})
export class AppModule {}
