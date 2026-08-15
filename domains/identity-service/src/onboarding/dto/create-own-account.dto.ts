import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class CreateAccountDto {
  @IsOptional() @IsIn(['individual', 'organization']) accountType?:
    'individual' | 'organization';
  @IsString() @Length(1, 200) displayName!: string;
  @IsOptional() @IsString() @Length(2, 2) countryCode?: string;
  @IsOptional() @IsString() @Length(2, 10) locale?: string;
  @IsOptional() @IsString() @Length(1, 50) timezone?: string;
  @IsOptional() @IsIn(['jalali', 'gregorian']) calendarPreference?:
    'jalali' | 'gregorian';
  @IsOptional() @IsIn(['metric', 'imperial']) measurementSystem?:
    'metric' | 'imperial';
  @IsOptional() @IsString() @Length(3, 3) defaultCurrencyCode?: string;
  @IsString() @Length(1, 30) dataRegion!: string;
}
