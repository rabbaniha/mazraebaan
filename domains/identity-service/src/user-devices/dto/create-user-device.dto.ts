import {
  IsString,
  IsOptional,
  IsBoolean,
  IsIn,
  IsIP,
  IsDateString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateUserDeviceDto {
  // --- Relationship ---

  @IsString()
  @Length(26, 26)
  userId!: string;

  // --- Device Identity ---

  @IsIn(['web', 'android', 'ios', 'desktop'])
  deviceType!: 'web' | 'android' | 'ios' | 'desktop';

  @IsString()
  @Length(1, 200)
  deviceName!: string;

  @IsString()
  @Length(1, 100)
  osName!: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  appVersion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  pushToken?: string;

  @IsIP()
  ipAddress!: string;

  // --- Browser / Hardware ---

  @IsString()
  @Length(1, 512)
  fingerprint!: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  browser?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  platform?: string;

  // --- Flags ---

  @IsOptional()
  @IsBoolean()
  isTrusted?: boolean;

  // --- Activity ---

  @IsDateString()
  lastSeenAt!: string;
}
