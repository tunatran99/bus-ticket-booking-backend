import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsDateString, IsOptional, IsNumber, Min, IsString } from 'class-validator';
import { TripStatus } from '../trip.entity';

export class CreateTripDto {
  @ApiProperty({ description: 'Route ID', example: 1 })
  @IsInt()
  routeId!: number;

  @ApiProperty({ description: 'Bus ID', example: 1 })
  @IsInt()
  busId!: number;

  @ApiProperty({ description: 'Departure time (ISO 8601)', example: '2025-11-25T08:00:00Z' })
  @IsDateString()
  departureTime!: string;

  @ApiProperty({ description: 'Arrival time (ISO 8601)', required: false })
  @IsOptional()
  @IsDateString()
  arrivalTime?: string;

  @ApiProperty({ description: 'Base price for the trip', example: 500000 })
  @IsNumber()
  @Min(0)
  basePrice!: number;

  @ApiProperty({ description: 'Trip status', enum: TripStatus, default: TripStatus.SCHEDULED })
  @IsOptional()
  @IsString()
  status?: TripStatus;

  @ApiProperty({ description: 'Notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}


