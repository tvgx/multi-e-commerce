import { Controller, Post, Body, Param } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { BaseResponseDto } from '../common/dto/base-response.dto';

@Controller('api/payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post(':method/intent')
  async createIntent(
    @Param('method') method: string,
    @Body('amount') amount: number,
    @Body('currency') currency: string,
    @Body('orderId') orderId: string,
    @Body('metadata') metadata?: any,
  ): Promise<BaseResponseDto<any>> {
    const intent = await this.paymentService.processPayment(method, amount, currency, orderId, metadata);
    return BaseResponseDto.success(intent);
  }
}
