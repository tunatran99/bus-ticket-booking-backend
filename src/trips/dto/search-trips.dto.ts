import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsNumber, Min, IsEnum, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export enum SortBy {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  TIME_ASC = 'time_asc',
  TIME_DESC = 'time_desc',
  DURATION_ASC = 'duration_asc',
  DURATION_DESC = 'duration_desc',
}

export class SearchTripsDto {
  @ApiProperty({ description: 'Origin city/location', example: 'Hà Nội', required: false })
  @IsOptional()
  @IsString()
  origin?: string;

  @ApiProperty({ description: 'Destination city/location', example: 'Hồ Chí Minh', required: false })
  @IsOptional()
  @IsString()
  destination?: string;

  @ApiProperty({ description: 'Travel date (YYYY-MM-DD)', example: '2025-12-10', required: false })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ description: 'Minimum departure time (HH:mm)', example: '08:00', required: false })
  @IsOptional()
  @IsString()
  timeFrom?: string;

  @ApiProperty({ description: 'Maximum departure time (HH:mm)', example: '18:00', required: false })
  @IsOptional()
  @IsString()
  timeTo?: string;

  @ApiProperty({ description: 'Minimum price', example: 100000, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiProperty({ description: 'Maximum price', example: 500000, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiProperty({ description: 'Bus type (from seat types)', example: 'regular', required: false })
  @IsOptional()
  @IsString()
  busType?: string;

  @ApiProperty({ description: 'Sort by', enum: SortBy, default: SortBy.TIME_ASC, required: false })
  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy;

  @ApiProperty({ description: 'Page number', example: 1, default: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({ description: 'Items per page', example: 10, default: 10, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}


