import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsPhoneNumber, IsEmail, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'User' })
  @IsString()
  @IsOptional()
  firstname: string;

  @ApiProperty({ example: 'Useryan' })
  @IsString()
  @IsOptional()
  lastname: string;

  @ApiProperty({ example: '+37499999999' })
  @IsPhoneNumber('AM')
  @IsOptional()
  phone: string;

  @ApiProperty({ example: 'user@gmail.com' })
  @IsEmail()
  @IsOptional()
  email: string;
}
