import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'CurrentPass123!', description: 'Current password' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'NewPass123!', description: 'New password' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
