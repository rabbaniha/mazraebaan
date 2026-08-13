import { IsString, IsOptional, Length } from 'class-validator';

export class CreatePermissionDto {
  // --- Identity ---

  @IsString()
  @Length(1, 100)
  name!: string;

  @IsString()
  @Length(1, 50)
  resource!: string;

  @IsString()
  @Length(1, 50)
  action!: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;
}
