import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PaymentProvider, PaymentIntent } from './payment.interface';
import { QRCodeService } from './qrcode.service';
import { OnlineBankingQRProvider } from './online-banking-qr.provider';
@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private providers: Map<string, PaymentProvider> = new Map();

  constructor(private qrCodeService: QRCodeService) {
    // Register Online Banking QR Provider
    this.registerProvider(new OnlineBankingQRProvider(this.qrCodeService));
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
}
