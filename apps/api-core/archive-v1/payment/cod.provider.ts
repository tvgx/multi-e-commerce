import { Logger } from '@nestjs/common';
import {
  PaymentProvider,
  PaymentIntent,
} from './payment.interface';

/**
 * Cash On Delivery (COD) Payment Provider
 */
export class CODPaymentProvider implements PaymentProvider {
  private readonly logger = new Logger(CODPaymentProvider.name);

  async createPaymentIntent(
    amount: number,
    currency: string,
    orderId: string,
    metadata?: any,
  ): Promise<PaymentIntent> {
    const transactionId = `COD${Date.now()}${Math.floor(Math.random() * 1000)}`;
    this.logger.log(
      `COD Payment Intent created - Transaction: ${transactionId}, Order: ${orderId}, Amount: ${amount} ${currency}`,
    );
    return {
      transactionId,
      status: 'PENDING',
    };
  }

  async verifyPayment(transactionId: string): Promise<boolean> {
    // COD is verified manually by the shop owner/shipper upon delivery
    return true;
  }

  getProviderName(): string {
    return 'COD';
  }
}
