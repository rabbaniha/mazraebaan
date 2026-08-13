import { IsString, MinLength } from 'class-validator';

export class RefreshDto {
  // JWT compact serialization is comfortably over 20 chars; this only guards
  // against empty/blank payloads reaching the strategy.
  @IsString()
  @MinLength(20)
  refreshToken!: string;
}
