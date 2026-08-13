import { IsString, IsEmail, Length, MaxLength } from 'class-validator';

export class VerifyDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @Length(6, 6)
  code!: string;
}
