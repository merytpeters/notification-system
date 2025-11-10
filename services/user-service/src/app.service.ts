import { Injectable } from '@nestjs/common';
import { getSafeUptime } from './utils/uptime.util';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

   checkHealth() {
    return {
      success: true,
      message: 'User Service is healthy',
      data: {
        service: 'user-service',
        status: 'UP',
        timestamp: new Date().toISOString(),
        uptime: getSafeUptime(),
      },
    };
  }

}
