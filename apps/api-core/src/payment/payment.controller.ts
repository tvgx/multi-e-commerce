import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PrismaService } from '../database/prisma.service';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import {
  ConfirmPaymentDto,
  PaymentConfirmationAction,
} from './payment-confirm.dto';

@Controller('api/payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly prisma: PrismaService,
  ) {}

  @Get(':paymentId')
  async getPayment(
    @Param('paymentId') paymentId: string,
  ): Promise<BaseResponseDto<any>> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: true,
        paymentMethod: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    return BaseResponseDto.success(payment);
  }

  @Post(':method/intent')
  async createIntent(
    @Param('method') method: string,
    @Body('amount') amount: number,
    @Body('currency') currency: string,
    @Body('orderId') orderId: string,
    @Body('metadata') metadata?: any,
  ): Promise<BaseResponseDto<any>> {
    const intent = await this.paymentService.processPayment(
      method,
      amount,
      currency,
      orderId,
      metadata,
    );
    return BaseResponseDto.success(intent);
  }

  @Post(':paymentId/confirm')
  async confirmPayment(
    @Param('paymentId') paymentId: string,
    @Body() dto: ConfirmPaymentDto,
  ): Promise<BaseResponseDto<any>> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    if (
      !['checkout', 'awaiting_confirmation', 'pending'].includes(payment.state)
    ) {
      throw new BadRequestException(
        `Payment cannot be confirmed in state: ${payment.state}.`,
      );
    }

    const newState =
      dto.action === PaymentConfirmationAction.ACCEPT ? 'completed' : 'failed';

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        state: newState,
      },
    });

    if (dto.action === PaymentConfirmationAction.ACCEPT) {
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: {
          paymentState: 'paid',
        },
      });
    }

    const finalPayment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    return BaseResponseDto.success({
      payment: finalPayment,
      message: `Payment ${
        dto.action === PaymentConfirmationAction.ACCEPT
          ? 'confirmed'
          : 'rejected'
      } successfully`,
      statusCode: HttpStatus.OK,
    });
  }
}
