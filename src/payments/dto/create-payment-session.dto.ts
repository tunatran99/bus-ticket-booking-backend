import { IsNotEmpty, IsOptional, IsString, IsUrl } from "class-validator";

export class CreatePaymentSessionDto {
  @IsString()
  @IsNotEmpty()
  bookingReference!: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  successUrl!: string;

  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false })
  cancelUrl?: string;
}
