import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { QRCodeService } from './qrcode.service';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, QRCodeService],
  exports: [PaymentService, QRCodeService],
})
export class PaymentModule {}
