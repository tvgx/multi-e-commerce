import { Logger } from '@nestjs/common';
import {
  PaymentProvider,
  PaymentIntent,
  QRCodeData,
} from './payment.interface';
import { QRCodeService } from './qrcode.service';

/**
 * Online Banking QR Code Payment Provider
 *
 * Generates self-created banking transaction QR codes
 * NOT connected to real bank APIs or money transfers
 *
 * Transaction Flow:
 * 1. Customer selects "Online Banking QR" at checkout
 * 2. API generates unique QR code with transaction data
 * 3. Customer scans QR → modal popup shows bill info
 * 4. Customer clicks Accept/Reject in modal
 * 5. Payment state updates: AWAITING_CONFIRMATION → COMPLETED (or FAILED)
 */
export class OnlineBankingQRProvider implements PaymentProvider {
  private readonly logger = new Logger(OnlineBankingQRProvider.name);

  constructor(private qrCodeService: QRCodeService) {}

  /**
   * Generate banking transaction QR code
   * @param amount Transaction amount
   * @param currency Currency code (e.g., 'VND')
   * @param orderId Order ID
   * @param metadata Additional metadata (shopName, customerName, etc.)
   * @returns PaymentIntent with QR code
   */
  async createPaymentIntent(
    amount: number,
    currency: string,
    orderId: string,
    metadata?: {
      shopName?: string;
      customerName?: string;
      customerEmail?: string;
    },
  ): Promise<PaymentIntent> {
    try {
      // Generate unique transaction ID
      const transactionId = this.generateTransactionId();

      // Create current date/time in readable format
      const now = new Date();
      const date = now.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Build QR code data
      const qrData: QRCodeData = {
        transactionId,
        date,
        from: metadata?.customerName ?? 'Customer',
        to: metadata?.shopName ?? 'Shop Owner',
        amount,
        currency,
        method: 'Online Banking QR',
        status: 'Pending Payment',
        note: `Order #${orderId}`,
      };

      // Generate QR code image (base64)
      const qrCodeBase64 = await this.qrCodeService.generateQRCode(qrData);

      this.logger.log(
        `Online Banking QR Code created - Transaction: ${transactionId}, Amount: ${amount} ${currency}, Order: ${orderId}`,
      );

      return {
        transactionId,
        status: 'PENDING',
        qrCode: qrCodeBase64,
        qrData,
        paymentUrl: `data:image/png;base64,${qrCodeBase64}`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create banking QR code: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Verify payment (stub implementation)
   * Real verification happens via confirmation endpoint
   */
  async verifyPayment(transactionId: string): Promise<boolean> {
    // In this implementation, verification happens when user
    // clicks Accept in the confirmation modal, which calls
    // POST /api/payments/:paymentId/confirm
    await Promise.resolve(); // Mark method as async by adding await
    this.logger.debug(`Verification pending for transaction: ${transactionId}`);
    return true;
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return 'ONLINE_BANKING_QR';
  }

  /**
   * Generate unique transaction ID
   * Format: OB + timestamp (12 digits) + random (6 digits)
   */
  private generateTransactionId(): string {
    const timestamp = Date.now().toString().slice(-12);
    const randomSuffix = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
    return `OB${timestamp}${randomSuffix}`;
  }
}
