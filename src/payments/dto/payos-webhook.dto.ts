import { IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";

export class PayOsWebhookDto {
  @IsString()
  @IsNotEmpty()
  signature!: string;

  @IsObject()
  data!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  event?: string;
}
