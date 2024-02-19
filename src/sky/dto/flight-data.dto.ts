import { IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { LegDto } from './leg.dto';

export class FlightDataDto {
  @IsString()
  link: string;

  @IsNumber()
  price: number;

  @Type(() => LegDto)
  @ValidateNested()
  legs: LegDto;
}
