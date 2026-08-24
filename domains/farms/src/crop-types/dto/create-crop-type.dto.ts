import {
  IsString,
  IsOptional,
  IsBoolean,
  Length,
  MaxLength,
} from 'class-validator';

/**
 * Creates a crop type (reference/master data). Admin-only.
 */
export class CreateCropTypeDto {
  @IsString()
  @Length(1, 50)
  code!: string;

  @IsString()
  @Length(1, 100)
  name_fa!: string;

  @IsString()
  @Length(1, 100)
  name_en!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  scientific_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
