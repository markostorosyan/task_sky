import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { FilteredSkyDto } from './dto/filtered-sky.dto';

@Injectable()
export class SkyService {
  constructor(private httpService: HttpService) {}

  async getFlights(filteredSkyDto: FilteredSkyDto) {
    const response = await lastValueFrom(
      this.httpService.post(
        'https://partners.api.skyscanner.net/apiservices/v3/flights/live/search/create',
        {
          query: {
            market: 'UK',
            locale: 'en-GB',
            currency: filteredSkyDto.currency,
            query_legs: [
              {
                origin_place_id: { iata: filteredSkyDto.from },
                destination_place_id: { iata: filteredSkyDto.to },
                date: {
                  year: filteredSkyDto.year,
                  month: filteredSkyDto.month,
                  day: filteredSkyDto.day,
                },
              },
            ],
            adults: filteredSkyDto.adults,
            cabin_class: filteredSkyDto.cabinClass,
          },
        },
        {
          headers: {
            'x-api-key': 'sh428739766321522266746152871799',
          },
        },
      ),
    );

    const session = response.data.sessionToken;

    const fin = await lastValueFrom(
      this.httpService.post(
        `https://partners.api.skyscanner.net/apiservices/v3/flights/live/search/poll/${session}`,
        {},
        {
          headers: {
            'x-api-key': 'sh428739766321522266746152871799',
          },
        },
      ),
    );

    return fin.data;

    // curl --location --request POST 'https://partners.api.skyscanner.net/apiservices/v3/flights/live/search/poll/SESSION_TOKEN' --header 'x-api-key: sh428739766321522266746152871799'

    // curl --request POST 'https://partners.api.skyscanner.net/apiservices/v3/flights/live/search/create' --header 'x-api-key: sh428739766321522266746152871799' --data ' {"query":{"market":"UK","locale":"en-GB","currency":"GBP","query_legs":[{"origin_place_id":{"iata":"LHR"},"destination_place_id":{"iata":"SIN"},"date":{"year":2024,"month":12,"day":22}}],"adults":1,"cabin_class":"CABIN_CLASS_ECONOMY"}}'
  }
}
