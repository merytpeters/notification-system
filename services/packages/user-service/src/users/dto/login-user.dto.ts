import { IsString, IsOptional, MinLength, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
    @ApiProperty({ example: 'user@example.com', required: true })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'SecurePass123!', required: true })
    @IsString()
    @MinLength(8)
    password: string;

    @ApiProperty({ example: 'fcm_token_here', required: false })
    @IsOptional()
    @IsString()
    push_token?: string;
}