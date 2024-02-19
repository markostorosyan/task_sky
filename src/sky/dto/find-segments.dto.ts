import { IsString } from 'class-validator';

export class FindSegments {
  @IsString()
  arrivals: string;

  @IsString()
  departures: string;

  @IsString()
  departuresDate: string;

  @IsString()
  arrivalsDate: string;

  @IsString()
  duration: string;

  @IsString()
  waitingTime: string;

  @IsString()
  marketingFlightNumber: string;
}
