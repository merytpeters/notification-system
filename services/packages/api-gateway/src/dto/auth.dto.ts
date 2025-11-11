import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsNotEmpty, IsOptional } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  access_token: string;

  @ApiProperty({ example: 'bearer' })
  token_type: string;

  @ApiProperty({ example: 86400 })
  expires_in: number;

  @ApiProperty({
    example: {
      id: '123',
      email: 'user@example.com',
      name: 'John Doe',
    },
  })
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({ example: 'fcm_token_here', required: false })
  @IsOptional()
  @IsString()
  push_token?: string;
}

export class RegisterResponseDto {
  @ApiProperty({
    example: {
      id: '123',
      email: 'user@example.com',
      full_name: 'John Doe',
      is_active: true,
      created_at: '2025-11-11T01:40:44.231Z',
      preferences: {
        email_enabled: true,
        push_enabled: true,
      },
    },
  })
  user: {
    id: string;
    email: string;
    full_name: string;
    is_active: boolean;
    created_at: string;
    preferences: {
      email_enabled: boolean;
      push_enabled: boolean;
    };
  };
}