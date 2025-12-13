import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRouteStopDto {
  @ApiProperty({ description: 'Location name', example: 'Bến xe Miền Đông' })
  @IsString()
  locationName!: string;

  @ApiProperty({ description: 'Full address', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'Latitude', required: false })
  @IsOptional()
  latitude?: number;

  @ApiProperty({ description: 'Longitude', required: false })
  @IsOptional()
  longitude?: number;

  @ApiProperty({ description: 'Order of stop in route (0, 1, 2, ...)', example: 0 })
  @IsInt()
  @Min(0)
  order!: number;

  @ApiProperty({ description: 'Minutes from route start', example: 0 })
  @IsInt()
  @Min(0)
  minutesFromStart!: number;

  @ApiProperty({ description: 'Can passengers board here', default: true })
  @IsBoolean()
  isPickup!: boolean;

  @ApiProperty({ description: 'Can passengers alight here', default: true })
  @IsBoolean()
  isDropoff!: boolean;
}

export class CreateRouteDto {
  @ApiProperty({ description: 'Route name', example: 'Hà Nội - Hồ Chí Minh' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Route description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Distance in kilometers', example: 1700 })
  @IsInt()
  @Min(0)
  distance!: number;

  @ApiProperty({ description: 'Estimated duration in minutes', example: 1200 })
  @IsInt()
  @Min(0)
  estimatedDuration!: number;

  @ApiProperty({ description: 'Route stops', type: [CreateRouteStopDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRouteStopDto)
  stops!: CreateRouteStopDto[];

  @ApiProperty({ description: 'Is route active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}


