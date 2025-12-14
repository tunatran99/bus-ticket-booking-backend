import { IsEmail, IsNotEmpty, IsString, ValidateIf } from "class-validator";

export class ContactVerificationDto {
  @ValidateIf((dto) => !dto.email)
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @ValidateIf((dto) => !dto.phone)
  @IsEmail()
  @IsNotEmpty()
  email?: string;
}
