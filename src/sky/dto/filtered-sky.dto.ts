import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class FilteredSkyDto {
  @IsNotEmpty()
  @IsString()
  market: string;

  @IsNotEmpty()
  @IsString()
  locale: string;

  @IsNotEmpty()
  @IsString()
  from: string;

  @IsNotEmpty()
  @IsString()
  to: string;

  @IsNotEmpty()
  @IsString()
  currency: string;

  @IsNotEmpty()
  @IsNumber()
  year: number;

  @IsNotEmpty()
  @IsNumber()
  month: number;

  @IsNotEmpty()
  @IsNumber()
  day: number;

  @IsNotEmpty()
  @IsNumber()
  adults: number;

  @IsNotEmpty()
  @IsString()
  cabinClass: string;
}
