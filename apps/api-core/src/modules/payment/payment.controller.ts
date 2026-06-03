import { Controller, Post, Body, Req, Headers, UseGuards } from '@nestjs/common';
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
}

