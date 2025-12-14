import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class SeatAvailabilityQueryDto {
  @IsString()
  @IsNotEmpty()
  route!: string;

  @IsString()
  @IsNotEmpty()
  travelDate!: string;

  @IsOptional()
  @IsString()
  busPlate?: string;

  @IsOptional()
  @IsString()
  seatType?: string;
}
