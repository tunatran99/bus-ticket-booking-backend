import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class BookingContactDto {
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class BookingPassengerDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  idNumber!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @IsNotEmpty()
  seatLabel!: string;
}

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  route!: string;

  @IsString()
  @IsNotEmpty()
  travelDate!: string;

  @IsOptional()
  @IsString()
  arrival?: string;

  @IsOptional()
  @IsString()
  seatType?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  seatCount!: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  pricePerTicket!: number;

  @IsOptional()
  @IsString()
  terminal?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  busPlate?: string;

  @ValidateNested()
  @Type(() => BookingContactDto)
  contact!: BookingContactDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BookingPassengerDto)
  passengers!: BookingPassengerDto[];
}
