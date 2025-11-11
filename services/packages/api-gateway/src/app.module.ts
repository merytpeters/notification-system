import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ControllersModule } from './controllers/controllers.module';
import { UtilsModule } from './utils/utils.module';
import { ConfigModules } from './config/config.module';
import { AuthModule } from './auth/auth.module';
import { DtoModule } from './dto/dto.module';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [ControllersModule, UtilsModule, ConfigModules, AuthModule, DtoModule, ServicesModule],
  controllers: [AppController],
  providers: [AppService],
  
})
export class AppModule {}
