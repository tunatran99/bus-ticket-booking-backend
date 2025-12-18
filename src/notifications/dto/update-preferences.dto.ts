import { Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, Max, Min } from "class-validator";

export class UpdateNotificationPreferencesDto {
  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  emailEnabled!: boolean;

  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  smsEnabled!: boolean;

  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(72)
  reminderHoursBefore!: number;
}
