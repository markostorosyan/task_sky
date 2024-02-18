import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { FilteredSkyDto } from './dto/filtered-sky.dto';
import { DateTime } from 'luxon';

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
    // this.findSegments();
    this.findCountry('legs');
    // this.findCountry('segment');
    this.objectData.data.forEach((obj) => this.stopTime(obj.legs.segments));
    this.objectData.data.forEach((obj) =>
      this.calculateTotalWaitingTime(obj.legs),
    );
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
            // segment: item.fares.map((s) => s.segmentId),
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
        if (index[type].from === key) {
          index[type].from = places[key].name;
        }
        if (index[type].to === key) {
          index[type].to = places[key].name;
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
            // marketingCarrierIds,
            // operatingCarrierIds,
            segmentIds,
          } = data[key];
          const segmentId = this.findSegmentsByIds(segmentIds);
          // const marketingCarrier = this.findCarriers(marketingCarrierIds);
          // const operatingCarrier = this.findCarriers(operatingCarrierIds);
          const departuresDate = DateTime.fromObject({
            year: departureDateTime.year,
            month: departureDateTime.month,
            day: departureDateTime.day,
            hour: departureDateTime.hour,
            minute: departureDateTime.minute,
          }).toFormat('dd.L.yy HH:mm');
          const arrivalsDate = DateTime.fromObject({
            year: arrivalDateTime.year,
            month: arrivalDateTime.month,
            day: arrivalDateTime.day,
            hour: arrivalDateTime.hour,
            minute: arrivalDateTime.minute,
          }).toFormat('dd.L.yy HH:mm');
          l.legs = {
            from: originPlaceId,
            to: destinationPlaceId,
            departuresDate,
            arrivalsDate,
            duration: this.formatDuration(durationInMinutes),
            totalWaitingTime: '',
            stopCount,
            // marketingCarrier,
            // operatingCarrier,
            segments: segmentId,
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
            // marketingCarrierId,
            // operatingCarrierId,
          } = data[key];
          const placeObject = this.findCountryForSegment(
            originPlaceId,
            destinationPlaceId,
          );
          // const marketingCarrier = this.findCarriers(marketingCarrierId);
          // const operatingCarrier = this.findCarriers(operatingCarrierId);
          // const arrivalsDate = new Date()  // if don't need luxon
          const departuresDate = DateTime.fromObject({
            year: departureDateTime.year,
            month: departureDateTime.month,
            day: departureDateTime.day,
            hour: departureDateTime.hour,
            minute: departureDateTime.minute,
          }).toFormat('dd.L.yy HH:mm');
          const arrivalsDate = DateTime.fromObject({
            year: arrivalDateTime.year,
            month: arrivalDateTime.month,
            day: arrivalDateTime.day,
            hour: arrivalDateTime.hour,
            minute: arrivalDateTime.minute,
          }).toFormat('dd.L.yy HH:mm');
          segmentsArr.push({
            arrivals: placeObject[originPlaceId],
            departures: placeObject[destinationPlaceId],
            departuresDate,
            arrivalsDate,
            duration: this.formatDuration(durationInMinutes),
            waitingTime: '',
            marketingFlightNumber,
            // marketingCarrier, // need?
            // operatingCarrier, // need?
          });
        }
      }
    }
    return segmentsArr;
  }

  formatDuration(durationInMinutes) {
    const minute = durationInMinutes % 60;
    const hour = (durationInMinutes - minute) / 60;

    return `${hour}h:${minute}m`;
  }

  dateTimeToMinutes(date) {
    const time = date.slice(-5);
    const hour = time.slice(0, 2) * 60;
    const minute = Number(time.slice(-2));
    return hour + minute;
  }

  timeToMinutes(time) {
    if (!time) {
      return 0;
    }
    const hourIndex = time.indexOf('h');
    const minuteIndex = time.indexOf('m');
    const divisionIndex = time.indexOf(':');
    const hour = time.slice(0, hourIndex);
    const minute = time.slice(divisionIndex + 1, minuteIndex);
    return hour * 60 + Number(minute);
  }

  calculateTotalWaitingTime(leg) {
    let time = 0;
    for (const s of leg.segments) {
      const minutes = this.timeToMinutes(s.waitingTime);
      time = time + minutes;
    }

    leg.totalWaitingTime = this.formatDuration(time);
  }

  stopTime(segments) {
    const from = this.objectData.data[0]?.legs.from;
    const to = this.objectData.data[0]?.legs.to;
    if (segments.length <= 1) {
      return;
    }
    for (const city of segments) {
      if (from === city.arrivals) {
        delete city.waitingTime;
      }
      if (to === city.departures) {
        const arrivalsTime = this.dateTimeToMinutes(city.departuresDate);
        for (const obj of segments) {
          if (city.arrivals === obj.departures) {
            const departuresTime = this.dateTimeToMinutes(obj.arrivalsDate);
            const result = this.formatDuration(arrivalsTime - departuresTime);
            city.waitingTime = result;
          }
        }
      }
      if (segments.length > 2) {
        for (const obj of segments) {
          if (city.departures === obj.arrivals && obj.arrivals !== from) {
            const arrivalsTime = this.dateTimeToMinutes(city.arrivalsDate);
            const departuresTime = this.dateTimeToMinutes(obj.departuresDate);
            const result = this.formatDuration(departuresTime - arrivalsTime);
            obj.waitingTime = result;
          }
        }
      }
    }
  }

  // stopTime(segments) {
  //   const from = this.objectData.data[0]?.from;
  //   const to = this.objectData.data[0]?.to;
  //   if (segments.length <= 1) {
  //     return;
  //   }
  //   for (const city of segments) {
  //     if (from === city.arrivals) {
  //       const arrivalsTime = this.timeToMinutes(city.arrivalsDate);
  //       for (const obj of segments) {
  //         if (city.departures === obj.arrivals) {
  //           const departuresTime = this.timeToMinutes(obj.departuresDate);
  //           const result = this.formatDuration(departuresTime - arrivalsTime);
  //           return result;
  //         }
  //       }
  //     }
  //     if (to === city.departures) {
  //       const arrivalsTime = this.timeToMinutes(city.arrivalsDate);
  //       for (const obj of segments) {
  //         if (city.arrivals === obj.departures) {
  //           const departuresTime = this.timeToMinutes(obj.departuresDate);
  //           const result = this.formatDuration(departuresTime - arrivalsTime);
  //           return result;
  //         }
  //       }
  //     }
  //     if (segments.length > 2) {
  //       for (const obj of segments) {
  //         if (city.arrivals === obj.departures) {
  //           const arrivalsTime = this.timeToMinutes(city.arrivalsDate);
  //           const departuresTime = this.timeToMinutes(obj.departuresDate);
  //           const result = this.formatDuration(departuresTime - arrivalsTime);
  //           return result;
  //         }
  //       }
  //     }
  //   }
  // }

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
