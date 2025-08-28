// paypal/paypal.module.ts
import { Module } from '@nestjs/common';
import { PaypalService } from './paypal.service';
import { PaypalController } from './paypal.controller';

@Module({
  providers: [PaypalService],
  controllers: [PaypalController],
  exports: [PaypalService], // export if used elsewhere
})
export class PaypalModule {}
