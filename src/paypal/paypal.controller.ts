import { Controller, Post, Body, Query, Get } from '@nestjs/common';
import { PaypalService } from './paypal.service';
import { log } from 'node:console';

@Controller('paypal')
export class PaypalController {
  constructor(private readonly paypalService: PaypalService) {}

  @Post('create-order')
  async createOrder(@Body() body: { amount?: string }) {
    try {
      const order = await this.paypalService.createOrder(body.amount);

      const approvalUrl = order.links.find((link) => link.rel === 'approve')?.href;

      if (!approvalUrl) throw new Error('Approval URL not found');

      console.log('Created PayPal order:', order);
      console.log('Approval URL:', approvalUrl);
      return {
        success: true,
        orderId: order.id,
        approvalUrl,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('capture-order')
  async captureOrder(@Body('orderId') orderId: string) {
    try {
      const capture = await this.paypalService.captureOrder(orderId);
      console.log('Captured PayPal order:', capture);
      return { success: true, capture };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

   @Get('success')
  async paypalSuccess(
    @Query('token') token: string, // PayPal sends "token" = orderId
    @Query('PayerID') payerId: string, // sometimes included, mainly for old APIs
  ) {
    try {
      const capture = await this.paypalService.captureOrder(token);
      return {
        message: 'Payment successful ✅',
        orderId: token,
        payerId,
        details: capture,
      };
    } catch (err) {
      return { message: 'Error capturing order', error: err.message };
    }
  }

@Get('paypal/cancel')
paypalCancel() {
  return { message: 'Payment cancelled by user' };
}

  @Get('order-details')
  async getOrderDetails(@Query('orderId') orderId: string) {
    try {
      const order = await this.paypalService.getOrderDetails(orderId);
      return { success: true, order };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
