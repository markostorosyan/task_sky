import { IsString, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @Length(6, 50)
  oldPassword: string;

  @IsString()
  @Length(6, 50)
  newPassword: string;
}
