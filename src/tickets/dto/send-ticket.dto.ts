import { Type } from "class-transformer";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

class PassengerDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  id?: string;
}

class SeatDto {
  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  coach?: string;
}

class RouteDto {
  @IsString()
  @IsNotEmpty()
  origin!: string;

  @IsString()
  @IsNotEmpty()
  destination!: string;
}

class BusDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  plate?: string;
}

class SegmentDto {
  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsOptional()
  @IsString()
  terminal?: string;

  @IsString()
  @IsNotEmpty()
  time!: string;

  @IsOptional()
  @IsString()
  gate?: string;

  @IsOptional()
  @IsString()
  boardingTime?: string;
}

class TicketPayloadDto {
  @IsString()
  @IsNotEmpty()
  bookingReference!: string;

  @IsString()
  @IsNotEmpty()
  issuedBy!: string;

  @ValidateNested()
  @Type(() => PassengerDto)
  passenger!: PassengerDto;

  @ValidateNested()
  @Type(() => SeatDto)
  seat!: SeatDto;

  @ValidateNested()
  @Type(() => RouteDto)
  route!: RouteDto;

  @ValidateNested()
  @Type(() => BusDto)
  bus!: BusDto;

  @ValidateNested()
  @Type(() => SegmentDto)
  departure!: SegmentDto;

  @ValidateNested()
  @Type(() => SegmentDto)
  arrival!: SegmentDto;

  @IsOptional()
  @IsString()
  supportContact?: string;
}

export class SendTicketDto {
  @IsEmail()
  recipient!: string;

  @ValidateNested()
  @Type(() => TicketPayloadDto)
  ticket!: TicketPayloadDto;
}
