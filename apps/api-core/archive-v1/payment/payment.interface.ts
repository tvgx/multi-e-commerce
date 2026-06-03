/**
 * QR Code data for online banking transactions
 */
export interface QRCodeData {
  transactionId: string;
  date: string;
  from: string; // Customer name
  to: string; // Shop owner name
  amount: number;
  currency: string;
  method: string;
  status?: string;
  note?: string;
}

export interface PaymentIntent {
  transactionId: string;
  clientSecret?: string;
  paymentUrl?: string;
  qrCode?: string; // Base64 encoded QR code image
  qrData?: QRCodeData; // Structured QR data
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REQUIRES_ACTION';
}

export interface PaymentProvider {
  createPaymentIntent(
    amount: number,
    currency: string,
    orderId: string,
    metadata?: any,
  ): Promise<PaymentIntent>;
  verifyPayment(transactionId: string): Promise<boolean>;
  getProviderName(): string;
}
