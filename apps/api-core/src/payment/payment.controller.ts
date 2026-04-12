import {
  Controller,
  Post,
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

  /**
   * Confirm Online Banking QR payment
   * POST /api/payments/:paymentId/confirm
   */
  @Post(':paymentId/confirm')
  async confirmPayment(
    @Param('paymentId') paymentId: string,
    @Body() dto: ConfirmPaymentDto,
  ): Promise<BaseResponseDto<any>> {
    // Find payment
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    // Verify payment is in correct state for confirmation
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    if (!['checkout', 'awaiting_confirmation'].includes(payment.state)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new BadRequestException(
        `Payment cannot be confirmed in state: ${payment.state}. Expected: checkout or awaiting_confirmation`,
      );
    }

    // Update payment state based on action
    const newState =
      dto.action === PaymentConfirmationAction.ACCEPT ? 'completed' : 'failed';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        state: newState,
      },
    });

    // If accepted, update order payment state
    if (dto.action === PaymentConfirmationAction.ACCEPT) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const paymentOrderId = payment.orderId;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await this.prisma.order.update({
        where: { id: paymentOrderId },
        data: {
          paymentState: 'paid',
        },
      });
    }

    // Refetch payment with order details
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
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
