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

    const secondRequest = await lastValueFrom(
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
    const result = secondRequest.data.content.results.itineraries;

    const findingKey = this.findKey(result, 'pricingOptions');

    const mappingFind = findingKey.map((obj) => {
      return obj.items;
    });

    const extractedData = mappingFind.flatMap((item) => {
      if (item[0]?.price && item[0]?.price?.amount) {
        const deepLink = item[0].deepLink;
        const priceAmount = item[0].price.amount;
        return { deepLink, priceAmount };
      }
    });

    const finalResult = extractedData.map((a) => {
      return { price: Number(a.priceAmount) / 1000, link: a.deepLink };
    });

    return finalResult;
  }

  findKey(obj, targetKey) {
    for (const key in obj) {
      if (key === targetKey) {
        return obj[key];
      } else if (typeof obj[key] === 'object') {
        const result = this.findKey(obj[key], targetKey);
        if (result !== undefined) {
          return result;
        }
      }
    }
  }
}
