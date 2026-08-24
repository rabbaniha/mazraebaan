import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './common/auth/auth.module';
import { AccessTokenGuard } from './common/auth/access-token.guard';
import { FarmsModule } from './farms/farms.module';
import { FarmBoundariesModule } from './farm-boundaries/farm-boundaries.module';
import { FarmBoundaryChangeLogsModule } from './farm-boundary-change-logs/farm-boundary-change-logs.module';
import { FarmSeasonsModule } from './farm-seasons/farm-seasons.module';
import { FarmPlotsModule } from './farm-plots/farm-plots.module';
import { CropTypesModule } from './crop-types/crop-types.module';
import { FarmCultivationsModule } from './farm-cultivations/farm-cultivations.module';
import { FarmAccessGrantsModule } from './farm-access-grants/farm-access-grants.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USER ?? 'mazraebaan',
      password: process.env.DB_PASS ?? 'mazraebaan_dev_pass',
      database: process.env.DB_NAME ?? 'farms_db',
      autoLoadEntities: true,
      // Never auto-sync — schema is owned by migrations (see src/migrations/).
      synchronize: false,
    }),
    AuthModule,
    FarmsModule,
    FarmBoundariesModule,
    FarmBoundaryChangeLogsModule,
    FarmSeasonsModule,
    FarmPlotsModule,
    CropTypesModule,
    FarmCultivationsModule,
    FarmAccessGrantsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useExisting: AccessTokenGuard,
    },
  ],
})
export class AppModule {}
