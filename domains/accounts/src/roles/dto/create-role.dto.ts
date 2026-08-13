import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  Length,
} from 'class-validator';

export class CreateRoleDto {
  // --- Identity ---

  @IsString()
  @Length(1, 50)
  name!: string;

  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  // --- Permissions (assigned at role creation) ---

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  permissionIds?: string[];
}
