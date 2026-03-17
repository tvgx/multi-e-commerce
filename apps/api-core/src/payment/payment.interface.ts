export interface PaymentIntent {
  transactionId: string;
  clientSecret?: string;
  paymentUrl?: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REQUIRES_ACTION';
}

export interface PaymentProvider {
  createPaymentIntent(amount: number, currency: string, orderId: string, metadata?: any): Promise<PaymentIntent>;
  verifyPayment(transactionId: string): Promise<boolean>;
  getProviderName(): string;
}
