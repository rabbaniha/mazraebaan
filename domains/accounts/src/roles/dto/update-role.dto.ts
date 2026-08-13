import {
  IsString,
  IsOptional,
  IsArray,
  ArrayMaxSize,
  Length,
} from 'class-validator';

export class UpdateRoleDto {
  // --- Identity ---

  @IsOptional()
  @IsString()
  @Length(1, 50)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  // --- Permission reassignment ---

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  permissionIds?: string[];
}
