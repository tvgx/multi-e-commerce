import {
  Injectable,
  Logger,
  NotFoundException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { PaymentProvider, PaymentIntent } from './payment.interface';
import { QRCodeService } from './qrcode.service';
import { OnlineBankingQRProvider } from './online-banking-qr.provider';
import { CODPaymentProvider } from './cod.provider';
import { PrismaService } from '../database/prisma.service';
import { CustomException } from '../common/exceptions/custom.exception';
import { ResponseCodes } from '../common/constants/response-codes.constant';
import { BaseResponseDto } from '../common/dto/base-response.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private providers: Map<string, PaymentProvider> = new Map();

  constructor(
    private qrCodeService: QRCodeService,
    private readonly prisma: PrismaService,
  ) {
    // Register Online Banking QR Provider
    this.registerProvider(new OnlineBankingQRProvider(this.qrCodeService));
    // Register COD Provider
    this.registerProvider(new CODPaymentProvider());
  }

  registerProvider(provider: PaymentProvider) {
    this.providers.set(provider.getProviderName(), provider);
  }

  getProvider(name: string): PaymentProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new NotFoundException(`Payment provider ${name} not found`);
    }
    return provider;
  }

  async processPayment(
    methodName: string,
    amount: number,
    currency: string,
    orderId: string,
    metadata?: any,
  ): Promise<PaymentIntent> {
    this.logger.log(
      `Processing payment for Order ${orderId} via ${methodName}`,
    );
    const provider = this.getProvider(methodName);
    return provider.createPaymentIntent(amount, currency, orderId, metadata);
  }

  async voidPayment(
    ownerId: string,
    paymentId: string,
  ): Promise<BaseResponseDto<any>> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: { order: { include: { shop: true } } },
      });

      if (!payment) {
        throw new NotFoundException(`Payment ${paymentId} not found`);
      }

      if (payment.order.shop.ownerId !== ownerId) {
        throw new CustomException(
          ResponseCodes.NOT_ACCESS,
          'Not access.',
          HttpStatus.FORBIDDEN,
        );
      }

      if (
        !['checkout', 'awaiting_confirmation', 'pending'].includes(
          payment.state,
        )
      ) {
        throw new CustomException(
          ResponseCodes.METHOD_INVALID,
          `Payment cannot be voided in state: ${payment.state}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const updated = await this.prisma.$transaction(async (tx) => {
        const p = await tx.payment.update({
          where: { id: paymentId },
          data: { state: 'void' },
        });

        await tx.order.update({
          where: { id: payment.orderId },
          data: { paymentState: 'void' },
        });

        return p;
      });

      return BaseResponseDto.success(updated);
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new InternalServerErrorException('Failed to void payment');
    }
  }

  async refundPayment(
    ownerId: string,
    paymentId: string,
  ): Promise<BaseResponseDto<any>> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: { order: { include: { shop: true } } },
      });

      if (!payment) {
        throw new NotFoundException(`Payment ${paymentId} not found`);
      }

      if (payment.order.shop.ownerId !== ownerId) {
        throw new CustomException(
          ResponseCodes.NOT_ACCESS,
          'Not access.',
          HttpStatus.FORBIDDEN,
        );
      }

      if (payment.state !== 'completed') {
        throw new CustomException(
          ResponseCodes.METHOD_INVALID,
          `Only completed payments can be refunded. Current state: ${payment.state}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const updated = await this.prisma.$transaction(async (tx) => {
        const p = await tx.payment.update({
          where: { id: paymentId },
          data: { state: 'refunded' },
        });

        await tx.order.update({
          where: { id: payment.orderId },
          data: { paymentState: 'credit_owed' },
        });

        return p;
      });

      return BaseResponseDto.success(updated);
    } catch (error) {
      if (error instanceof CustomException) throw error;
      throw new InternalServerErrorException('Failed to refund payment');
    }
  }
}

