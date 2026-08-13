import { IsOptional, IsDateString } from 'class-validator';

export class UpdateAccountInviteDto {
  // Expiration can be adjusted while the invitation is still pending.
  // Lifecycle transitions (accept/revoke/decline) are driven by dedicated
  // service methods, not by this generic update DTO.

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
