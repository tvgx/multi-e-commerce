import { Controller, Post, Get, Param, Body, Req, Headers, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto, PaymentWebhookDto } from './dto/payment.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-url')
  createUrl(@Body() dto: CreatePaymentDto) {
    // Creating payment URL is usually done by the customer who placed the order
    return this.paymentService.createPaymentUrl(dto);
  }

  @Public()
  @Post('webhook')
  handleWebhook(@Body() dto: PaymentWebhookDto, @Headers('x-shop-id') shopId: string) {
    return this.paymentService.handleWebhook(dto, shopId);
  }

  @Public()
  @Post('confirm')
  confirmPayment(@Body('token') token: string, @Body('action') action: 'confirm' | 'reject') {
    return this.paymentService.confirmPayment(token, action);
  }

  @Get('status/:orderId')
  getPaymentStatus(@Param('orderId') orderId: string) {
    return this.paymentService.getPaymentStatus(orderId);
  }
}

