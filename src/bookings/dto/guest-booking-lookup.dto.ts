import { Type } from "class-transformer";
import { IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { ContactVerificationDto } from "./contact-verification.dto";

export class GuestBookingLookupDto {
  @IsString()
  @IsNotEmpty()
  bookingReference!: string;

  @ValidateNested()
  @Type(() => ContactVerificationDto)
  contact!: ContactVerificationDto;
}
