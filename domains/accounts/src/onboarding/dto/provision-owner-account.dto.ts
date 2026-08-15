import { Type } from 'class-transformer';
import { IsString, Length, ValidateNested } from 'class-validator';
import { CreateAccountDto } from '../../accounts/dto/create-account.dto';

/** Trusted request sent only by identity-service after it validates onboarding. */
export class ProvisionOwnerAccountDto {
  @IsString()
  @Length(26, 26)
  userId!: string;

  @ValidateNested()
  @Type(() => CreateAccountDto)
  account!: CreateAccountDto;
}
