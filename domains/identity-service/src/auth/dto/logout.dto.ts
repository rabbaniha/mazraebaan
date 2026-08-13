import { IsString, IsBoolean, IsOptional, MinLength } from 'class-validator';

export class LogoutDto {
  @IsString()
  @MinLength(20)
  refreshToken!: string;

  /** When true, revokes every active refresh token for the user. */
  @IsOptional()
  @IsBoolean()
  allSessions?: boolean;
}
