import { Injectable, UnauthorizedException, BadRequestException, ConflictException, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserServiceClient } from '../services/user-service.client';
import { LoginDto, AuthResponseDto, RegisterDto, RegisterResponseDto } from '../dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private userServiceClient: UserServiceClient,
  ) { }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    try {
      this.logger.debug(`Attempting to login user: ${loginDto.email}`);

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
        name: user.full_name || user.name,
      };

      const jwtExpiresIn = this.configService.get<string>('jwt.expiresIn') || '24h';
      const access_token = this.jwtService.sign(payload);
      const expiresIn = this.parseExpiresIn(jwtExpiresIn);

      this.logger.debug(`Successfully logged in user: ${loginDto.email}`);

      return {
        access_token,
        token_type: 'bearer',
        expires_in: expiresIn,
        user: {
          id: user.id,
          email: user.email,
          name: user.full_name || user.name || '',
        },
      };
    } catch (error) {
      this.logger.error('Login failed', error);

      // Handle service unavailable errors
      if (error.status === 503) {
        throw new HttpException(
          'User service is currently unavailable. Please try again later.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Handle HTTP errors with proper status codes
      if (error.response) {
        throw new HttpException(
          error.response.data?.message || error.response.data?.error || 'Authentication failed',
          error.response.status,
        );
      }

      throw new UnauthorizedException('Authentication failed');
    }
  }

  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    try {
      this.logger.debug(`Attempting to register user: ${registerDto.email}`);

      // Create user via User Service
      const user = await this.userServiceClient.createUser(
        registerDto.email,
        registerDto.password,
        registerDto.full_name,
        registerDto.push_token,
      );

      this.logger.debug(`Successfully registered user: ${registerDto.email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name || user.name || '',
          is_active: user.is_active || true,
          created_at: user.created_at || new Date().toISOString(),
          preferences: {
            email_enabled: user.preferences.email_enabled || user.preferences.email || true,
            push_enabled: user.preferences.push_enabled || user.preferences.push || true,
          },
        },
      };
    } catch (error) {
      this.logger.error('Registration failed', error);

      // Handle service unavailable errors
      if (error.status === 503) {
        throw new HttpException(
          'User service is currently unavailable. Please try again later.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      // Check if it's a duplicate user error
      if (error.response?.data?.message && error.response.data.message.includes('already exists')) {
        throw new ConflictException('User with this email already exists');
      }

      // Check if it's a validation error
      if (error.response?.data?.message && error.response.data.message.includes('validation')) {
        throw new BadRequestException(error.response.data.message);
      }

      // Check if it's a validation error from class-validator
      if (error.response?.status === 400 && error.response?.data?.message) {
        throw new BadRequestException(error.response.data.message);
      }

      // Handle HTTP errors with proper status codes
      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.error || 'Registration failed';
        this.logger.error(`HTTP Error: ${error.response.status} - ${errorMessage}`);
        throw new HttpException(errorMessage, error.response.status);
      }

      // Generic registration error with more details
      const errorMessage = error.message || 'Registration failed. Please check your input and try again.';
      this.logger.error(`Generic Error: ${errorMessage}`);
      throw new BadRequestException(errorMessage);
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