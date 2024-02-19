import { Body, Controller, Get } from '@nestjs/common';
import { SkyService } from './sky.service';
import { FilteredSkyDto } from './dto/filtered-sky.dto';
import { FlightDto } from './dto/flight.dto';

@Controller('sky')
export class SkyController {
  constructor(private skyService: SkyService) {}

  @Get()
  async getFlights(@Body() filteredSkyDto: FilteredSkyDto): Promise<FlightDto> {
    const result = await this.skyService.getFlights(filteredSkyDto);

    return result;
  }
}
