import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
    @ApiProperty({ example: 'Jane Doe', required: true })
    @IsString()
    full_name?: string;

    @ApiProperty({ example: 'fcm_token_here', required: false })
    @IsOptional()
    @IsString()
    push_token?: string;

    @ApiProperty({ example: 'NewPassword123!', required: true })
    @IsOptional()
    @IsString()
    @MinLength(8)
    password?: string;
}