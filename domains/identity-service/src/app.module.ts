import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthIdentitiesModule } from './auth-identities/auth-identities.module';
import { UserDevicesModule } from './user-devices/user-devices.module';
import { RefreshTokensModule } from './refresh-tokens/refresh-tokens.module';
import { AuthModule } from './auth/auth.module';
import { OtpVerificationsModule } from './otp-verifications/otp-verifications.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USER ?? 'mazraebaan',
      password: process.env.DB_PASS ?? 'mazraebaan_dev_pass',
      database: process.env.DB_NAME ?? 'identity_db',
      autoLoadEntities: true,
      // Never auto-sync schema — use migrations for DDL changes.
      synchronize: true,
    }),
    UsersModule,
    AuthIdentitiesModule,
    UserDevicesModule,
    RefreshTokensModule,
    AuthModule,
    OtpVerificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
