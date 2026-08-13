import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthIdentitiesService } from './auth-identities.service';
import { AuthIdentitiesController } from './auth-identities.controller';
import { AuthIdentity } from './entities/auth-identity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuthIdentity])],
  controllers: [AuthIdentitiesController],
  providers: [AuthIdentitiesService],
  exports: [AuthIdentitiesService],
})
export class AuthIdentitiesModule {}
