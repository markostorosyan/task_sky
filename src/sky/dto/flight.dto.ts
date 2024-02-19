import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { FlightDataDto } from './flight-data.dto';

export class FlightDto {
  @Type(() => FlightDataDto)
  @ValidateNested()
  data: FlightDataDto[];
}
