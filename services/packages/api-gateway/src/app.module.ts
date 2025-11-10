import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ControllersModule } from './controllers/controllers.module';
import { UtilsModule } from './utils/utils.module';

@Module({
  imports: [ControllersModule, UtilsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
