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
      message: 'Api GateWay Service is healthy',
      data: {
        service: 'api gateway-service',
        status: 'UP',
        timestamp: new Date().toISOString(),
        uptime: getSafeUptime(),
      },
    };
  }
}
