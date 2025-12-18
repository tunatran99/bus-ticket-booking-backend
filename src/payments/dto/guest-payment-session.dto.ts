import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";
import { CreatePaymentSessionDto } from "./create-payment-session.dto";
import { ContactVerificationDto } from "../../bookings/dto/contact-verification.dto";

export class GuestPaymentSessionDto extends CreatePaymentSessionDto {
  @ValidateNested()
  @Type(() => ContactVerificationDto)
  contact!: ContactVerificationDto;
}
