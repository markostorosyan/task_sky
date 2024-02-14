import { Body, Controller, Get } from '@nestjs/common';
import { SkyService } from './sky.service';
import { FilteredSkyDto } from './dto/filtered-sky.dto';

@Controller('sky')
export class SkyController {
  constructor(private skyService: SkyService) {}

  @Get()
  async testFunction(@Body() filteredSkyDto: FilteredSkyDto) {
    const res = await this.skyService.getFlights(filteredSkyDto);

    return res;
  }
}
