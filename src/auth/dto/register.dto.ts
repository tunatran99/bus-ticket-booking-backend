import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEnum,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({
    example: '+84901234567',
    description: 'Vietnamese phone number',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^(\+84|0)[0-9]{9,10}$/, {
    message: 'Invalid Vietnamese phone number format',
  })
  phone?: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description:
      'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain uppercase, lowercase, number, and special character',
  })
  password: string;

  @ApiProperty({
    example: 'Nguyen Van A',
    description: 'User full name',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters' })
  @MaxLength(100, { message: 'Full name must not exceed 100 characters' })
  fullName?: string;

  @ApiProperty({
    example: 'passenger',
    enum: ['passenger', 'admin'],
    default: 'passenger',
    required: false,
  })
  @IsEnum(['passenger', 'admin'])
  @IsOptional()
  role?: string = 'passenger';
}
