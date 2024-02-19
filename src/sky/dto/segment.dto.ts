import { IsString } from 'class-validator';

export class SegmentDto {
  @IsString()
  arrivals: string;

  @IsString()
  departures: string;

  @IsString()
  departuresDat: string;

  @IsString()
  arrivalsDate: string;

  @IsString()
  duration: string;

  @IsString()
  waitingTime: string;

  @IsString()
  marketingFlightNumber: string;
}
