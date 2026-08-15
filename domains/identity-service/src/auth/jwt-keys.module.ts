import { Module } from '@nestjs/common';
import { JwtKeysService } from './jwt-keys.service';

@Module({
  providers: [JwtKeysService],
  exports: [JwtKeysService],
})
export class JwtKeysModule {}
