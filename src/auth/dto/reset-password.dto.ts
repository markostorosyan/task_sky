import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'password1!' })
  @IsString()
  @Length(6, 50)
  oldPassword: string;

  @ApiProperty({ example: 'password3!' })
  @IsString()
  @Length(6, 50)
  newPassword: string;
}
