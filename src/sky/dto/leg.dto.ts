import { Type } from 'class-transformer';
import { IsNumber, IsString, ValidateNested } from 'class-validator';
import { SegmentDto } from './segment.dto';

export class LegDto {
  @IsString()
  from: string;

  @IsString()
  to: string;

  @IsString()
  departuresDate: string;

  @IsString()
  arrivalsDate: string;

  @IsString()
  duration: string;

  @IsString()
  totalWaitingTime: string;

  @IsNumber()
  stopCount: number;

  @Type(() => SegmentDto)
  @ValidateNested({ each: true })
  segments: SegmentDto[];
}
