import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { ControllersModule } from './controllers/controllers.module';

@Module({
  imports: [ConfigModule, ControllersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
