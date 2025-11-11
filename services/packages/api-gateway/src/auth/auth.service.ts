import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserServiceClient } from '../services/user-service.client';
import { LoginDto, AuthResponseDto } from '../dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private userServiceClient: UserServiceClient,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    try {
      // Validate user credentials via User Service
      const user = await this.userServiceClient.validateUser(
        loginDto.email,
        loginDto.password,
      );

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Generate JWT token
      const payload = {
        sub: user.id,
        email: user.email,
        name: user.name,
      };

      const jwtExpiresIn = this.configService.get<string>('jwt.expiresIn') || '24h';
      const access_token = this.jwtService.sign(payload);
      const expiresIn = this.parseExpiresIn(jwtExpiresIn);

      return {
        access_token,
        token_type: 'bearer',
        expires_in: expiresIn,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    } catch (error) {
      this.logger.error('Login failed', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async validateToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      this.logger.error('Token validation failed', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private parseExpiresIn(expiresIn: string): number {
    // Convert JWT expiresIn format (e.g., '24h', '7d') to seconds
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 86400; // Default to 24 hours

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * (multipliers[unit] || 3600);
  }
}