import { Injectable, Logger } from '@nestjs/common';
import { QRCodeData } from './payment.interface';

/**
 * QR Code Generation Service
 * Generates QR codes for self-created banking transactions
 *
 * **Installation Required:**
 * npm install qrcode
 */
@Injectable()
export class QRCodeService {
  private readonly logger = new Logger(QRCodeService.name);

  /**
   * Format transaction data for QR code (pipe-delimited)
   * @param data QR Code data containing transaction details
   * @returns Formatted string representation
   */
  formatQRData(data: QRCodeData): string {
    const lines = [
      `TRANSACTION_ID: ${data.transactionId}`,
      `DATE: ${data.date}`,
      `FROM: ${data.from}`,
      `TO: ${data.to}`,
      `AMOUNT: ${data.amount.toLocaleString('vi-VN')} ${data.currency}`,
      `METHOD: ${data.method}`,
      ...(data.status ? [`STATUS: ${data.status}`] : []),
      ...(data.note ? [`NOTE: ${data.note}`] : []),
    ];
    return lines.join('|');
  }

  /**
   * Generate JSON representation of QR data
   * @param data QR Code data
   * @returns JSON string
   */
  toJSON(data: QRCodeData): string {
    return JSON.stringify(data);
  }

  /**
   * Generate QR code image (Base64)
   * @param data QR Code data
   * @returns Promise<string> Base64 encoded QR code image
   */
  async generateQRCode(data: QRCodeData): Promise<string> {
    try {
      // Dynamically import qrcode library for optional dependency
      const QRCode = await import('qrcode');

      // Use JSON format for QR content
      const qrContent = this.toJSON(data);

      // Generate QR code as data URL (PNG)
      const qrCodeDataUrl = await QRCode.toDataURL(qrContent, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      // Extract Base64 from data URL (remove 'data:image/png;base64,' prefix)
      const base64QR = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');

      this.logger.debug(
        `QR code generated for transaction ${data.transactionId}`,
      );
      return base64QR;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to generate QR code: ${errorMessage}`);

      // If qrcode package not installed, return empty string
      // Frontend will handle missing QR gracefully
      if (errorMessage.includes('Cannot find module')) {
        this.logger.warn(
          'qrcode package not installed. Install with: npm install qrcode',
        );
        return '';
      }

      throw error;
    }
  }

  /**
   * Generate display text for QR code (human readable)
   * @param data QR Code data
   * @returns Formatted display text
   */
  generateDisplayText(data: QRCodeData): string {
    const lines = [
      '='.repeat(50),
      'BANKING TRANSACTION',
      '='.repeat(50),
      '',
      `Transaction ID:  ${data.transactionId}`,
      `Date:            ${data.date}`,
      `From:            ${data.from}`,
      `To:              ${data.to}`,
      `Amount:          ${data.amount.toLocaleString('vi-VN')} ${data.currency}`,
      `Method:          ${data.method}`,
      ...(data.status ? [`Status:          ${data.status}`] : []),
      ...(data.note ? [`Note:            ${data.note}`] : []),
      '',
      '='.repeat(50),
    ];
    return lines.join('\n');
  }
}
