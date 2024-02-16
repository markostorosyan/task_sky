import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { FilteredSkyDto } from './dto/filtered-sky.dto';

@Injectable()
export class SkyService {
  objectData = { data: [] };
  segments;
  legs;
  places;
  carriers;
  alliances;
  constructor(private httpService: HttpService) {}

  async getFlights(filteredSkyDto: FilteredSkyDto) {
    const response = await lastValueFrom(
      this.httpService.post(
        'https://partners.api.skyscanner.net/apiservices/v3/flights/live/search/create',
        {
          query: {
            market: filteredSkyDto.market,
            locale: filteredSkyDto.locale,
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

    const source = secondRequest.data.content.results;
    this.legs = source.legs;
    this.segments = source.segments;
    this.places = source.places;
    this.carriers = source.carriers;
    this.alliances = source.alliances;

    this.findLegs();
    this.findSegments();
    this.findCountry('legs');
    this.findCountry('segment');

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

  findCountry(type) {
    const places = this.places;
    for (const key in places) {
      for (const index of this.objectData.data) {
        if (index[type].originPlace === key) {
          index[type].originPlace = places[key].name;
        }
        if (index[type].destinationPlace === key) {
          index[type].destinationPlace = places[key].name;
        }
      }
    }
  }

  findCountryForSegment(originPlaceId, destinationPlaceId) {
    const obj = {};
    const places = this.places;
    for (const key in places) {
      if (originPlaceId === key) {
        obj[originPlaceId] = places[key].name;
      }
      if (destinationPlaceId === key) {
        obj[destinationPlaceId] = places[key].name;
      }
    }

    return obj;
  }

  findCarriers(carriers) {
    const arr = [];
    const data = this.carriers;
    for (const key in data) {
      if (!Array.isArray(carriers)) {
        if (carriers === key) {
          const { name, allianceId, imageUrl, iata, icao, displayCode } =
            data[key];
          const alliance = this.findAllianceById(allianceId);
          return { name, alliance, imageUrl, iata, icao, displayCode };
        }
      }
      for (const id of carriers) {
        if (id === key) {
          const { name, allianceId, imageUrl, iata, icao, displayCode } =
            data[key];
          const alliance = this.findAllianceById(allianceId);
          arr.push({ name, alliance, imageUrl, iata, icao, displayCode });
        }
      }
    }
    return arr;
  }

  findAllianceById(id) {
    const data = this.alliances;
    for (const key in data) {
      if (id === key) {
        return data[key].name;
      }
    }
  }

  findLegs() {
    const data = this.legs;
    for (const key in data) {
      for (const l of this.objectData.data) {
        if (l.legs === key) {
          const {
            originPlaceId,
            destinationPlaceId,
            departureDateTime,
            arrivalDateTime,
            durationInMinutes,
            stopCount,
            marketingCarrierIds,
            operatingCarrierIds,
            segmentIds,
          } = data[key];
          const segmentId = this.findSegmentsByIds(segmentIds);
          const marketingCarrier = this.findCarriers(marketingCarrierIds);
          const operatingCarrier = this.findCarriers(operatingCarrierIds);
          l.legs = {
            originPlace: originPlaceId,
            destinationPlace: destinationPlaceId,
            departureDateTime,
            arrivalDateTime,
            durationInMinutes,
            stopCount,
            marketingCarrier,
            operatingCarrier,
            segment: segmentId,
          };
        }
      }
    }
  }

  findSegmentsByIds(arr) {
    const data = this.segments;
    const segmentsArr = [];
    for (const key in data) {
      for (const s of arr) {
        if (s === key) {
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
          const placeObject = this.findCountryForSegment(
            originPlaceId,
            destinationPlaceId,
          );
          const marketingCarrier = this.findCarriers(marketingCarrierId);
          const operatingCarrier = this.findCarriers(operatingCarrierId);
          segmentsArr.push({
            originPlace: placeObject[originPlaceId],
            destinationPlace: placeObject[destinationPlaceId],
            departureDateTime,
            arrivalDateTime,
            durationInMinutes,
            marketingFlightNumber,
            marketingCarrier,
            operatingCarrier,
          });
        }
      }
    }
    return segmentsArr;
  }

  findSegments() {
    const data = this.segments;
    for (const key in data) {
      for (const s of this.objectData.data) {
        if (s.segment[0] === key) {
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
          s.segment = {
            originPlace: originPlaceId,
            destinationPlace: destinationPlaceId,
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
}
