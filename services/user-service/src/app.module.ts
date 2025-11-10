import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { ControllersModule } from './controllers/controllers.module';
import { UtilsModule } from './utils/utils.module';

@Module({
  imports: [ConfigModule, ControllersModule, UtilsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
