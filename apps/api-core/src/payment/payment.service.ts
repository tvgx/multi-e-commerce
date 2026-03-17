import { Injectable, Logger } from '@nestjs/common';
import { PaymentProvider, PaymentIntent } from './payment.interface';

// Example COD Provider
class CODProvider implements PaymentProvider {
  async createPaymentIntent(amount: number, currency: string, orderId: string): Promise<PaymentIntent> {
    return {
      transactionId: `cod_${Date.now()}_${orderId}`,
      status: 'PENDING',
    };
  }
  async verifyPayment(transactionId: string): Promise<boolean> {
    return false; // COD is verified manually upon delivery
  }
  getProviderName(): string {
    return 'COD';
  }
}

// Example Mock Gateway
class MockGatewayProvider implements PaymentProvider {
  async createPaymentIntent(amount: number, currency: string, orderId: string): Promise<PaymentIntent> {
    return {
      transactionId: `mock_${Date.now()}_${orderId}`,
      status: 'SUCCEEDED', // Automatically succeed for mocking
    };
  }
  async verifyPayment(transactionId: string): Promise<boolean> {
    return true;
  }
  getProviderName(): string {
    return 'MOCK_GATEWAY';
  }
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private providers: Map<string, PaymentProvider> = new Map();

  constructor() {
    this.registerProvider(new CODProvider());
    this.registerProvider(new MockGatewayProvider());
  }

  registerProvider(provider: PaymentProvider) {
    this.providers.set(provider.getProviderName(), provider);
  }

  getProvider(name: string): PaymentProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Payment provider ${name} not found`);
    }
    return provider;
  }

  async processPayment(methodName: string, amount: number, currency: string, orderId: string, metadata?: any): Promise<PaymentIntent> {
    this.logger.log(`Processing payment for Order ${orderId} via ${methodName}`);
    const provider = this.getProvider(methodName);
    return provider.createPaymentIntent(amount, currency, orderId, metadata);
  }
}
