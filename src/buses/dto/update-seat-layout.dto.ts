import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSeatLayoutDto } from './create-bus.dto';

export class UpdateSeatLayoutDto {
  @ApiProperty({ description: 'Seat layouts', type: [CreateSeatLayoutDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSeatLayoutDto)
  seatLayouts!: CreateSeatLayoutDto[];
}


