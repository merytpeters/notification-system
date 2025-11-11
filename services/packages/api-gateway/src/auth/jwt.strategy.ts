import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private configService: ConfigService) {
    const jwtSecret = configService.get<string>('jwt.secret');
    
    if (!jwtSecret || jwtSecret === 'change-this-secret') {
      throw new Error('JWT_SECRET environment variable must be set with a secure value');
    }
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
    
    this.logger.log('JWT Strategy initialized');
  }

  async validate(payload: JwtPayload) {
    try {
      if (!payload.sub || !payload.email) {
        throw new UnauthorizedException('Invalid token payload: missing required fields');
      }

      // Additional validation can be added here
      // For example, check if the user still exists in the database
      
      this.logger.debug(`Validating JWT token for user: ${payload.sub}`);
      
      return {
        userId: payload.sub,
        email: payload.email,
        name: payload.name,
      };
    } catch (error) {
      this.logger.error(`JWT validation failed: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }
}