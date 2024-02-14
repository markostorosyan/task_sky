import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class FlightSearchDto {
  @IsNotEmpty()
  @IsString()
  market = 'UK';

  @IsNotEmpty()
  @IsString()
  locale = 'en-GB';

  @IsNotEmpty()
  @IsString()
  currency = 'GBP';

  @IsNotEmpty()
  query_legs: QueryLegDto[];

  @IsNotEmpty()
  @IsNumber()
  adults = 1;

  @IsNotEmpty()
  @IsString()
  cabin_class = 'CABIN_CLASS_ECONOMY';
}
export class PlaceIdDto {
  @IsNotEmpty()
  @IsString()
  iata = 'LHR';
}

export class DateDto {
  @IsNotEmpty()
  @IsNumber()
  year = 2024;

  @IsNotEmpty()
  @IsNumber()
  month = 6;

  @IsNotEmpty()
  @IsNumber()
  day = 12;
}

export class QueryLegDto {
  @IsNotEmpty()
  origin_place_id: PlaceIdDto;

  @IsNotEmpty()
  destination_place_id: PlaceIdDto;

  @IsNotEmpty()
  date: DateDto;
}
