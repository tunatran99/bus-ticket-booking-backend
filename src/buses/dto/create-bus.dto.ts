import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsNumber,
} from "class-validator";
import { Type } from "class-transformer";
import { SeatType, SeatPosition } from "../seat-layout.entity";

export class CreateSeatLayoutDto {
  @ApiProperty({ description: "Seat number", example: "1A" })
  @IsString()
  seatNumber!: string;

  @ApiProperty({ description: "Row number", example: 1 })
  @IsInt()
  @Min(1)
  row!: number;

  @ApiProperty({ description: "Column letter", example: "A" })
  @IsString()
  column!: string;

  @ApiProperty({
    description: "Seat type",
    enum: SeatType,
    default: SeatType.REGULAR,
  })
  @IsOptional()
  @IsString()
  seatType?: SeatType;

  @ApiProperty({
    description: "Seat position",
    enum: SeatPosition,
    required: false,
  })
  @IsOptional()
  @IsString()
  position?: SeatPosition;

  @ApiProperty({ description: "Base price for this seat", example: 500000 })
  @IsNumber()
  @Min(0)
  basePrice!: number;

  @ApiProperty({ description: "Is seat active", default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateBusDto {
  @ApiProperty({ description: "License plate", example: "29A-12345" })
  @IsString()
  licensePlate!: string;

  @ApiProperty({
    description: "Bus brand",
    required: false,
    example: "Mercedes",
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({ description: "Bus model", required: false })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ description: "Total number of seats", example: 40 })
  @IsInt()
  @Min(1)
  totalSeats!: number;

  @ApiProperty({ description: "Bus status", default: "active" })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: "Notes", required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: "List of amenities available on the bus",
    required: false,
    type: [String],
    example: ["wifi", "snacks"],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiProperty({
    description: "Seat layouts",
    type: [CreateSeatLayoutDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSeatLayoutDto)
  seatLayouts?: CreateSeatLayoutDto[];
}
