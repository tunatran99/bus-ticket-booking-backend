import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email or phone number',
  })
  @IsString()
  @IsNotEmpty({ message: 'Identifier is required' })
  identifier: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'User password',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
