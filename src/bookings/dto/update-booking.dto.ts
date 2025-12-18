import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  ValidateNested,
} from "class-validator";
import { BookingContactDto, BookingPassengerDto } from "./create-booking.dto";

export class UpdateBookingDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => BookingContactDto)
  contact?: BookingContactDto;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BookingPassengerDto)
  passengers?: BookingPassengerDto[];
}
