import { Module } from '@nestjs/common';
import { RabbitmqService } from './rabbitmq.service';
import { RedisService } from './redis.service';
import { NotificationService } from './notification.service';

@Module({
  providers: [RabbitmqService, RedisService, NotificationService]
})
export class ServicesModule {}
