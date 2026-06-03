import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../common/services/tenant.service';
import { CreatePaymentDto, PaymentWebhookDto } from './dto/payment.dto';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  private getShopId(): string {
    const shopId = this.tenantService.getTenantId();
    if (!shopId) throw new BadRequestException('Shop context is missing');
    return shopId;
  }

  async createPaymentUrl(dto: CreatePaymentDto) {
    const shopId = this.getShopId();
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, shopId },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Here you would integrate with VNPAY/Momo/Stripe etc.
    const mockCheckoutUrl = `https://checkout.sandbox.payment.com/${dto.orderId}?amount=${dto.amount}`;

    return { checkoutUrl: mockCheckoutUrl };
  }

  async handleWebhook(dto: PaymentWebhookDto, shopId?: string) {
    // In a real webhook, shopId might come from the webhook payload or URL path.
    // We update the order status based on transaction result.
    
    // Placeholder implementation
    return { status: 'success', transactionId: dto.transactionId };
  }
}

