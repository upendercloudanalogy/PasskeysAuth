import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PasskeyModule } from './passkey/passkey.module';
import {PaypalModule} from './paypal/paypal.module';

@Module({
  imports: [PasskeyModule, PaypalModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
