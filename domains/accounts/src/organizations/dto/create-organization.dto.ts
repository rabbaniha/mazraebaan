import {
  IsString,
  IsOptional,
  IsIn,
  IsEmail,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateOrganizationDto {
  // --- Relationship ---

  @IsString()
  @Length(26, 26)
  accountId!: string;

  // --- Legal / Business ---

  @IsString()
  @Length(1, 500)
  legalName!: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  brandName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  taxIdentifier?: string;

  // --- Billing ---

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  billingEmail?: string;

  @IsOptional()
  @IsString()
  @Length(1, 30)
  billingPhone?: string;

  // --- Classification ---

  @IsIn(['solo', 'small', 'medium', 'enterprise'])
  sizeCategory!: 'solo' | 'small' | 'medium' | 'enterprise';
}
