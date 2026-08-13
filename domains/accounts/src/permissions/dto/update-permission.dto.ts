import { IsString, IsOptional, Length } from 'class-validator';

export class UpdatePermissionDto {
  // --- Identity ---

  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  resource?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  action?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;
}
