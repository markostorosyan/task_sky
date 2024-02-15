import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { FilteredSkyDto } from './dto/filtered-sky.dto';

@Injectable()
export class SkyService {
  objectData = { data: [] };
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

    this.parseData(result);
    const legs = secondRequest.data.content.results.legs;
    const segments = secondRequest.data.content.results.segments;
    const places = secondRequest.data.content.results.places;

    this.objectData.data.forEach((leg) => this.findLegsById(leg.legs, legs));
    this.objectData.data.forEach((segment) =>
      segment.segment.forEach((f) => this.findSegmentById(f, segments)),
    );
    this.objectData.data.forEach((leg) =>
      this.findCountry(
        leg.legs.originPlaceId,
        leg.legs.destinationPlaceId,
        places,
        'legs',
      ),
    );

    this.objectData.data.forEach((seg) =>
      this.findCountry(
        seg.segmentData.originPlaceId,
        seg.segmentData.destinationPlaceId,
        places,
        'segmentData',
      ),
    );
    // for (const l in this.objectData.data[0]) {
    //   if (l === 'legs') {
    //     console.log(this.objectData.data[0][l]);
    //     // this.findCountry(l.originPlaceId, l.destinationPlaceId, places);
    //   }
    //   // console.log(l);
    // }
    // this.objectData.data.forEach((leg) =>
    //   this.findCountry(
    //     leg.legs.originPlaceId,
    //     leg.legs.destinationPlaceId,
    //     places,
    //   ),
    // );
    // const {} = this.objectData.data;
    // return places;

    // this.objectData.data.forEach((obj) => {
    //   // console.log(obj.legs, '----');
    //   const legsKey = obj.legs;
    //   if (legs.hasOwnProperty(legsKey)) {
    //     console.log('innnn');
    //     obj.legs = legs[legsKey];
    //   }
    // });

    return this.objectData;
  }

  parseData(obj) {
    for (const key in obj) {
      const arr = obj[key].pricingOptions;
      for (const beforeItem of arr) {
        for (const item of beforeItem.items) {
          this.objectData.data.push({
            link: item.deepLink,
            price: item.price?.amount / 1000,
            segment: item.fares.map((s) => s.segmentId),
            legs: obj[key].legIds[0],
          });
        }
      }
    }
  }

  findCountry(originPlaceId, destinationPlaceId, places, type) {
    for (const key in places) {
      if (key === originPlaceId) {
        for (const index of this.objectData.data) {
          index[type].originPlaceId = places[key].name;
        }
      }
      if (key === destinationPlaceId) {
        for (const index of this.objectData.data) {
          index[type].destinationPlaceId = places[key].name;
        }
      }
    }
  }

  findLegsById(legId, data) {
    for (const key in data) {
      if (key === legId) {
        for (const leg of this.objectData.data) {
          const {
            originPlaceId,
            destinationPlaceId,
            departureDateTime,
            arrivalDateTime,
            durationInMinutes,
            stopCount,
            marketingCarrierIds,
            operatingCarrierIds,
          } = data[key];
          leg.legs = {
            originPlaceId,
            destinationPlaceId,
            departureDateTime,
            arrivalDateTime,
            durationInMinutes,
            stopCount,
            marketingCarrierIds,
            operatingCarrierIds,
          };
        }
      }
    }
  }

  findSegmentById(segmentId, data) {
    for (const key in data) {
      if (key === segmentId) {
        for (const s of this.objectData.data) {
          const {
            originPlaceId,
            destinationPlaceId,
            departureDateTime,
            arrivalDateTime,
            durationInMinutes,
            marketingFlightNumber,
            marketingCarrierId,
            operatingCarrierId,
          } = data[key];
          s.segmentData = {
            originPlaceId,
            destinationPlaceId,
            departureDateTime,
            arrivalDateTime,
            durationInMinutes,
            marketingFlightNumber,
            marketingCarrierId,
            operatingCarrierId,
          };
        }
      }
    }
  }

  // findCountryForLegs(originPlaceId, destinationPlaceId, places) {
  //   for (const key in places) {
  //     if (key === originPlaceId) {
  //       for (const index of this.objectData.data) {
  //         index.legs.originPlaceId = places[key].name;
  //       }
  //     }
  //     if (key === destinationPlaceId) {
  //       for (const index of this.objectData.data) {
  //         index.legs.destinationPlaceId = places[key].name;
  //       }
  //     }
  //   }
  // }

  // findCountryForSegments(originPlaceId, destinationPlaceId, places) {
  //   for (const key in places) {
  //     if (key === originPlaceId) {
  //       for (const index of this.objectData.data) {
  //         index.segmentData.originPlaceId = places[key].name;
  //       }
  //     }
  //     if (key === destinationPlaceId) {
  //       for (const index of this.objectData.data) {
  //         index.segmentData.destinationPlaceId = places[key].name;
  //       }
  //     }
  //   }
  // }
}
